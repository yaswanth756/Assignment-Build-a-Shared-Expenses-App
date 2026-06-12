/**
 * Group Controller — CRUD for groups and member management.
 */

const prisma = require('../config/db');
const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * POST /api/groups
 * Create a new group. The creator is automatically added as admin.
 */
const createGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: req.user.id,
      members: {
        create: {
          userId: req.user.id,
          role: 'ADMIN',
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  sendSuccess(res, { group }, 201, 'Group created successfully.');
});

/**
 * GET /api/groups
 * Get all groups the current user is a member of.
 */
const getGroups = asyncHandler(async (req, res) => {
  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: { userId: req.user.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { expenses: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  sendSuccess(res, { groups });
});

/**
 * GET /api/groups/:id
 * Get a single group by ID with members and recent expenses.
 */
const getGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      expenses: {
        orderBy: { createdAt: 'desc' },
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
      },
      settlements: {
        orderBy: { createdAt: 'desc' },
        include: {
          payer: {
            select: { id: true, name: true, email: true },
          },
          payee: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!group) {
    throw new NotFoundError('Group not found.');
  }

  // Check if user is a member
  const isMember = group.members.some((m) => m.userId === req.user.id);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  sendSuccess(res, { group });
});

/**
 * PUT /api/groups/:id
 * Update group name/description. Only admin can update.
 */
const updateGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // Check membership and role
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: id, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new NotFoundError('Group not found.');
  }

  if (membership.role !== 'ADMIN') {
    throw new ForbiddenError('Only group admins can update the group.');
  }

  const group = await prisma.group.update({
    where: { id },
    data: {
      name: name?.trim(),
      description: description?.trim(),
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  sendSuccess(res, { group }, 200, 'Group updated successfully.');
});

/**
 * DELETE /api/groups/:id
 * Delete a group. Only admin can delete.
 */
const deleteGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: id, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new NotFoundError('Group not found.');
  }

  if (membership.role !== 'ADMIN') {
    throw new ForbiddenError('Only group admins can delete the group.');
  }

  await prisma.group.delete({ where: { id } });

  sendSuccess(res, null, 200, 'Group deleted successfully.');
});

/**
 * POST /api/groups/:id/members
 * Add a member to a group by email. Any member can add others.
 */
const addMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  // Verify requester is a member
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: id, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  // Find user to add
  const userToAdd = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!userToAdd) {
    throw new NotFoundError('No user found with that email. They need to register first.');
  }

  // Check if already a member
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: id, userId: userToAdd.id },
    },
  });

  if (existingMember) {
    throw new ConflictError('User is already a member of this group.');
  }

  // Add the member
  const newMember = await prisma.groupMember.create({
    data: {
      groupId: id,
      userId: userToAdd.id,
      role: 'MEMBER',
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  sendSuccess(res, { member: newMember }, 201, 'Member added successfully.');
});

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove a member from a group.
 * - Admin can remove anyone
 * - Members can only remove themselves
 * - Cannot remove if member has unsettled balances
 */
const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  // Verify requester is a member
  const requesterMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: id, userId: req.user.id },
    },
  });

  if (!requesterMembership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  // Only admin can remove others; members can remove themselves
  if (userId !== req.user.id && requesterMembership.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can remove other members.');
  }

  // Check if the user to be removed exists in the group
  const targetMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: id, userId },
    },
  });

  if (!targetMembership) {
    throw new NotFoundError('User is not a member of this group.');
  }

  // Prevent removing the last admin
  if (targetMembership.role === 'ADMIN') {
    const adminCount = await prisma.groupMember.count({
      where: { groupId: id, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      throw new BadRequestError('Cannot remove the last admin. Transfer admin role first or delete the group.');
    }
  }

  // Check for unsettled balances
  const expenses = await prisma.expense.findMany({
    where: { groupId: id },
    include: { splits: true },
  });

  const settlements = await prisma.settlement.findMany({
    where: { groupId: id },
  });

  // Calculate net balance for the user being removed
  let netBalance = 0;
  for (const expense of expenses) {
    if (expense.paidBy === userId) {
      // They paid, so others owe them
      const othersSplits = expense.splits.filter((s) => s.userId !== userId);
      netBalance += othersSplits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    }
    const userSplit = expense.splits.find((s) => s.userId === userId);
    if (userSplit && expense.paidBy !== userId) {
      // They owe money
      netBalance -= parseFloat(userSplit.amount);
    }
  }

  // Account for settlements
  for (const settlement of settlements) {
    if (settlement.paidBy === userId) {
      netBalance += parseFloat(settlement.amount);
    }
    if (settlement.paidTo === userId) {
      netBalance -= parseFloat(settlement.amount);
    }
  }

  if (Math.abs(netBalance) > 0.01) {
    throw new BadRequestError(
      `Cannot remove member. They have an unsettled balance of ${netBalance > 0 ? '+' : ''}${netBalance.toFixed(2)}. Settle all debts first.`
    );
  }

  // Remove member
  await prisma.groupMember.delete({
    where: {
      groupId_userId: { groupId: id, userId },
    },
  });

  sendSuccess(res, null, 200, 'Member removed successfully.');
});

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
};
