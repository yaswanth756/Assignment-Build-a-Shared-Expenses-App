/**
 * Balance Routes — /api/groups/:id/balances and /api/balances
 */

const { Router } = require('express');
const auth = require('../middleware/auth');
const { getGroupBalances, getOverallBalances } = require('../controllers/balanceController');

// Group balances router (mounted under /api/groups/:id/balances)
const groupBalanceRouter = Router({ mergeParams: true });
groupBalanceRouter.use(auth);
groupBalanceRouter.get('/', getGroupBalances);

// Overall balances router (mounted under /api/balances)
const overallBalanceRouter = Router();
overallBalanceRouter.use(auth);
overallBalanceRouter.get('/', getOverallBalances);

module.exports = {
  groupBalanceRouter,
  overallBalanceRouter,
};
