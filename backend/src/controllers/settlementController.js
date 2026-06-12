/**
 * Settlement Controller — Record and list debt settlements.
 */

const prisma = require('../config/db');
const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

/**
 * POST /api/groups/:groupId/settlements
 * Record a settlement (payment) between two users.
 */
const createSettlement = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { paidTo, amount } = req.body;

  // Verify requester is a group member
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  // Verify payee is a group member
  const payeeMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: paidTo },
    },
  });

  if (!payeeMembership) {
    throw new BadRequestError('The payee must be a member of this group.');
  }

  // Can't settle with yourself
  if (paidTo === req.user.id) {
    throw new BadRequestError('Cannot settle a debt with yourself.');
  }

  if (!amount || parseFloat(amount) <= 0) {
    throw new BadRequestError('Settlement amount must be greater than 0.');
  }

  const settlement = await prisma.settlement.create({
    data: {
      groupId,
      paidBy: req.user.id,
      paidTo,
      amount: parseFloat(amount),
    },
    include: {
      payer: {
        select: { id: true, name: true, email: true },
      },
      payee: {
        select: { id: true, name: true, email: true },
      },
      group: {
        select: { id: true, name: true },
      },
    },
  });

  sendSuccess(res, { settlement }, 201, 'Settlement recorded successfully.');
});

/**
 * GET /api/groups/:groupId/settlements
 * List all settlements in a group.
 */
const getGroupSettlements = asyncHandler(async (req, res) => {
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

  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: {
      payer: {
        select: { id: true, name: true, email: true },
      },
      payee: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { settlements });
});

module.exports = {
  createSettlement,
  getGroupSettlements,
};
