/**
 * Split Service — Handles all split calculation logic.
 *
 * Supported split types:
 * 1. EQUAL    — Divide equally among all participants
 * 2. UNEQUAL  — Each participant has an exact amount (must sum to total)
 * 3. PERCENTAGE — Each participant has a percentage (must sum to 100)
 * 4. SHARE    — Each participant has shares (amount proportional to shares)
 */

const { BadRequestError } = require('../utils/errors');
const { roundCurrency } = require('../utils/helpers');

/**
 * Calculate splits based on the split type.
 *
 * @param {number} totalAmount - Total expense amount
 * @param {string} splitType - One of: EQUAL, UNEQUAL, PERCENTAGE, SHARE
 * @param {Array} participants - Array of { userId, amount?, percentage?, shares? }
 * @returns {Array} Array of { userId, amount, percentage?, shares? }
 */
function calculateSplits(totalAmount, splitType, participants) {
  if (!participants || participants.length === 0) {
    throw new BadRequestError('At least one participant is required.');
  }

  totalAmount = parseFloat(totalAmount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    throw new BadRequestError('Amount must be a positive number.');
  }

  switch (splitType) {
    case 'EQUAL':
      return calculateEqualSplit(totalAmount, participants);
    case 'UNEQUAL':
      return calculateUnequalSplit(totalAmount, participants);
    case 'PERCENTAGE':
      return calculatePercentageSplit(totalAmount, participants);
    case 'SHARE':
      return calculateShareSplit(totalAmount, participants);
    default:
      throw new BadRequestError(`Invalid split type: ${splitType}`);
  }
}

/**
 * EQUAL SPLIT
 * Divide amount equally. Handle rounding by adding remainder to the first participant.
 */
function calculateEqualSplit(totalAmount, participants) {
  const count = participants.length;
  const perPerson = roundCurrency(totalAmount / count);
  const remainder = roundCurrency(totalAmount - perPerson * count);

  return participants.map((p, index) => ({
    userId: p.userId,
    amount: index === 0 ? roundCurrency(perPerson + remainder) : perPerson,
  }));
}

/**
 * UNEQUAL SPLIT
 * Each participant provides an exact amount. Must sum to total.
 */
function calculateUnequalSplit(totalAmount, participants) {
  const sum = participants.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);

  if (Math.abs(roundCurrency(sum) - totalAmount) > 0.01) {
    throw new BadRequestError(
      `Split amounts sum to ${roundCurrency(sum)}, but expense total is ${totalAmount}. They must be equal.`
    );
  }

  return participants.map((p) => ({
    userId: p.userId,
    amount: roundCurrency(parseFloat(p.amount)),
  }));
}

/**
 * PERCENTAGE SPLIT
 * Each participant provides a percentage. Must sum to 100.
 */
function calculatePercentageSplit(totalAmount, participants) {
  const totalPercentage = participants.reduce(
    (acc, p) => acc + parseFloat(p.percentage || 0),
    0
  );

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new BadRequestError(
      `Percentages sum to ${totalPercentage}%, but must sum to 100%.`
    );
  }

  const results = participants.map((p) => {
    const percentage = parseFloat(p.percentage);
    return {
      userId: p.userId,
      amount: roundCurrency((totalAmount * percentage) / 100),
      percentage,
    };
  });

  // Handle rounding discrepancy
  const computedSum = results.reduce((acc, r) => acc + r.amount, 0);
  const diff = roundCurrency(totalAmount - computedSum);
  if (Math.abs(diff) > 0) {
    results[0].amount = roundCurrency(results[0].amount + diff);
  }

  return results;
}

/**
 * SHARE SPLIT
 * Each participant provides a share count. Amount is proportional.
 * Example: shares [2, 1, 1] on $100 → [$50, $25, $25]
 */
function calculateShareSplit(totalAmount, participants) {
  const totalShares = participants.reduce(
    (acc, p) => acc + parseInt(p.shares || 0),
    0
  );

  if (totalShares <= 0) {
    throw new BadRequestError('Total shares must be greater than 0.');
  }

  const results = participants.map((p) => {
    const shares = parseInt(p.shares);
    return {
      userId: p.userId,
      amount: roundCurrency((totalAmount * shares) / totalShares),
      shares,
    };
  });

  // Handle rounding discrepancy
  const computedSum = results.reduce((acc, r) => acc + r.amount, 0);
  const diff = roundCurrency(totalAmount - computedSum);
  if (Math.abs(diff) > 0) {
    results[0].amount = roundCurrency(results[0].amount + diff);
  }

  return results;
}

module.exports = { calculateSplits };
