/**
 * Settlement Routes — /api/groups/:groupId/settlements
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { createSettlement, getGroupSettlements } = require('../controllers/settlementController');

const router = Router({ mergeParams: true });

// All settlement routes require authentication
router.use(auth);

// POST /api/groups/:groupId/settlements — Record a settlement
router.post(
  '/',
  [
    body('paidTo')
      .notEmpty()
      .withMessage('Payee (paidTo) is required.')
      .isUUID()
      .withMessage('paidTo must be a valid UUID.'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0.'),
  ],
  validate,
  createSettlement
);

// GET /api/groups/:groupId/settlements — List settlements
router.get('/', getGroupSettlements);

module.exports = router;
