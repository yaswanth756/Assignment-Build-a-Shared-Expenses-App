/**
 * Balance Controller — Endpoints for group and individual balance queries.
 */

const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { ForbiddenError } = require('../utils/errors');
const { calculateGroupBalances, calculateOverallBalances } = require('../services/balanceService');
const prisma = require('../config/db');

/**
 * GET /api/groups/:id/balances
 * Get balances for a specific group.
 */
const getGroupBalances = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: id, userId: req.user.id },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this group.');
  }

  const result = await calculateGroupBalances(id);

  sendSuccess(res, result);
});

/**
 * GET /api/balances
 * Get overall balance summary for the current user across all groups.
 */
const getOverallBalances = asyncHandler(async (req, res) => {
  const result = await calculateOverallBalances(req.user.id);
  sendSuccess(res, result);
});

module.exports = {
  getGroupBalances,
  getOverallBalances,
};
