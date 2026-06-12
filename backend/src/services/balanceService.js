/**
 * Balance Service — Calculates group-wise and overall balances.
 *
 * Balance Calculation Algorithm:
 * 1. For each expense, the payer is owed money by each participant (minus their own share)
 * 2. Net balance = SUM(what you paid for others) - SUM(what you owe others)
 * 3. Settlements reduce/increase the net amounts
 * 4. Simplify debts using a greedy algorithm
 */

const prisma = require('../config/db');
const { roundCurrency } = require('../utils/helpers');

/**
 * Calculate balances for a specific group.
 * Returns: who owes whom and how much.
 *
 * @param {string} groupId
 * @returns {Object} { balances: { userId: netAmount }, debts: [{ from, to, amount }], memberDetails }
 */
async function calculateGroupBalances(groupId) {
  // Fetch all expenses with splits
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
      payer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Fetch all settlements
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
  });

  // Fetch group members
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Build a net balance map: positive = owed money, negative = owes money
  const netBalances = {};

  // Initialize all members with 0
  members.forEach((m) => {
    netBalances[m.userId] = 0;
  });

  // Process expenses
  for (const expense of expenses) {
    const payerId = expense.paidBy;
    const totalAmount = parseFloat(expense.amount);

    for (const split of expense.splits) {
      const splitAmount = parseFloat(split.amount);

      if (split.userId === payerId) {
        // Payer's own share — they don't owe themselves
        continue;
      }

      // Payer is owed this amount
      netBalances[payerId] = roundCurrency((netBalances[payerId] || 0) + splitAmount);
      // This user owes this amount
      netBalances[split.userId] = roundCurrency((netBalances[split.userId] || 0) - splitAmount);
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    const amount = parseFloat(settlement.amount);
    // Payer reduces their debt (their balance goes up / less negative)
    netBalances[settlement.paidBy] = roundCurrency((netBalances[settlement.paidBy] || 0) + amount);
    // Payee reduces what they're owed (their balance goes down / less positive)
    netBalances[settlement.paidTo] = roundCurrency((netBalances[settlement.paidTo] || 0) - amount);
  }

  // Build member details map
  const memberDetails = {};
  members.forEach((m) => {
    memberDetails[m.userId] = {
      id: m.userId,
      name: m.user.name,
      email: m.user.email,
    };
  });

  // Simplify debts using greedy algorithm
  const debts = simplifyDebts(netBalances, memberDetails);

  return {
    balances: netBalances,
    debts,
    memberDetails,
  };
}

/**
 * Simplify debts using a greedy algorithm.
 * Match the largest creditor with the largest debtor iteratively.
 *
 * @param {Object} netBalances - { userId: netAmount }
 * @param {Object} memberDetails - { userId: { id, name, email } }
 * @returns {Array} [{ from: { id, name, email }, to: { id, name, email }, amount }]
 */
function simplifyDebts(netBalances, memberDetails) {
  const creditors = []; // positive balance (owed money)
  const debtors = [];   // negative balance (owe money)

  for (const [userId, balance] of Object.entries(netBalances)) {
    if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance) });
    }
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);

    if (settleAmount > 0.01) {
      debts.push({
        from: memberDetails[debtors[j].userId] || { id: debtors[j].userId },
        to: memberDetails[creditors[i].userId] || { id: creditors[i].userId },
        amount: roundCurrency(settleAmount),
      });
    }

    creditors[i].amount = roundCurrency(creditors[i].amount - settleAmount);
    debtors[j].amount = roundCurrency(debtors[j].amount - settleAmount);

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return debts;
}

/**
 * Calculate overall balances for a user across all their groups.
 *
 * @param {string} userId
 * @returns {Object} { totalOwed, totalOwing, netBalance, groupSummaries }
 */
async function calculateOverallBalances(userId) {
  // Get all groups the user belongs to
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        select: { id: true, name: true },
      },
    },
  });

  let totalOwed = 0;    // Money others owe you
  let totalOwing = 0;   // Money you owe others
  const groupSummaries = [];

  for (const membership of memberships) {
    const { balances, debts } = await calculateGroupBalances(membership.groupId);
    const userBalance = balances[userId] || 0;

    groupSummaries.push({
      groupId: membership.group.id,
      groupName: membership.group.name,
      balance: roundCurrency(userBalance),
    });

    if (userBalance > 0) {
      totalOwed += userBalance;
    } else {
      totalOwing += Math.abs(userBalance);
    }
  }

  return {
    totalOwed: roundCurrency(totalOwed),
    totalOwing: roundCurrency(totalOwing),
    netBalance: roundCurrency(totalOwed - totalOwing),
    groupSummaries,
  };
}

module.exports = {
  calculateGroupBalances,
  calculateOverallBalances,
};
