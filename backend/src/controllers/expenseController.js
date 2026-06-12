/**
 * Expense Controller — CRUD for expenses with split management.
 */

const prisma = require('../config/db');
const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const { calculateSplits } = require('../services/splitService');

/**
 * POST /api/groups/:groupId/expenses
 * Create a new expense in a group with splits.
 */
const createExpense = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { description, amount, paidBy, splitType, participants } = req.body;

  // Verify requester is a group member
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  // Verify payer is a group member
  const payerMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: paidBy },
    },
  });

  if (!payerMembership) {
    throw new BadRequestError('The payer must be a member of the group.');
  }

  // Verify all participants are group members
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = new Set(groupMembers.map((m) => m.userId));

  for (const p of participants) {
    if (!memberIds.has(p.userId)) {
      throw new BadRequestError(`Participant ${p.userId} is not a member of this group.`);
    }
  }

  // Calculate splits
  const splits = calculateSplits(parseFloat(amount), splitType, participants);

  // Create expense with splits in a transaction
  const expense = await prisma.$transaction(async (tx) => {
    const newExpense = await tx.expense.create({
      data: {
        groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        paidBy,
        splitType,
        createdBy: req.user.id,
        splits: {
          create: splits.map((s) => ({
            userId: s.userId,
            amount: s.amount,
            percentage: s.percentage || null,
            shares: s.shares || null,
          })),
        },
      },
      include: {
        payer: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Touch the group's updatedAt
    await tx.group.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });

    return newExpense;
  });

  sendSuccess(res, { expense }, 201, 'Expense created successfully.');
});

/**
 * GET /api/groups/:groupId/expenses
 * List all expenses in a group.
 */
const getGroupExpenses = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      payer: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      splits: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { expenses });
});

/**
 * GET /api/expenses/:id
 * Get a single expense by ID with full details.
 */
const getExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      group: {
        select: { id: true, name: true },
      },
      payer: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      splits: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!expense) {
    throw new NotFoundError('Expense not found.');
  }

  // Verify requester is a group member
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: expense.groupId, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  sendSuccess(res, { expense });
});

/**
 * PUT /api/expenses/:id
 * Update an expense. Only the creator can update.
 */
const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, amount, paidBy, splitType, participants } = req.body;

  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw new NotFoundError('Expense not found.');
  }

  if (expense.createdBy !== req.user.id) {
    throw new ForbiddenError('Only the creator can update this expense.');
  }

  // Recalculate splits if amount or split details changed
  let splits;
  if (amount && splitType && participants) {
    splits = calculateSplits(parseFloat(amount), splitType, participants);
  }

  const updatedExpense = await prisma.$transaction(async (tx) => {
    // If splits need updating, delete old splits and create new ones
    if (splits) {
      await tx.expenseSplit.deleteMany({
        where: { expenseId: id },
      });
    }

    const updated = await tx.expense.update({
      where: { id },
      data: {
        description: description?.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        paidBy: paidBy || undefined,
        splitType: splitType || undefined,
        ...(splits && {
          splits: {
            create: splits.map((s) => ({
              userId: s.userId,
              amount: s.amount,
              percentage: s.percentage || null,
              shares: s.shares || null,
            })),
          },
        }),
      },
      include: {
        payer: {
          select: { id: true, name: true, email: true },
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return updated;
  });

  sendSuccess(res, { expense: updatedExpense }, 200, 'Expense updated successfully.');
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense. Only creator or group admin can delete.
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw new NotFoundError('Expense not found.');
  }

  // Check if user is creator or group admin
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: expense.groupId, userId: req.user.id },
    },
  });

  if (expense.createdBy !== req.user.id && membership?.role !== 'ADMIN') {
    throw new ForbiddenError('Only the creator or group admin can delete this expense.');
  }

  await prisma.expense.delete({ where: { id } });

  sendSuccess(res, null, 200, 'Expense deleted successfully.');
});

/**
 * GET /api/expenses/:id/comments
 * Get all comments for an expense.
 */
const getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new NotFoundError('Expense not found.');
  }

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: expense.groupId, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  const comments = await prisma.expenseComment.findMany({
    where: { expenseId: id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  sendSuccess(res, { comments });
});

/**
 * POST /api/expenses/:id/comments
 * Add a comment to an expense.
 */
const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new NotFoundError('Expense not found.');
  }

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: expense.groupId, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  const comment = await prisma.expenseComment.create({
    data: {
      expenseId: id,
      userId: req.user.id,
      content: content.trim(),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  sendSuccess(res, { comment }, 201, 'Comment added.');
});

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getComments,
  addComment,
};
