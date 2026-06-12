/**
 * Expense Routes — /api/groups/:groupId/expenses and /api/expenses/:id
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  createExpense,
  getGroupExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getComments,
  addComment,
} = require('../controllers/expenseController');

const router = Router({ mergeParams: true }); // mergeParams to access :groupId from parent

// All expense routes require authentication
router.use(auth);

// POST /api/groups/:groupId/expenses — Create expense
router.post(
  '/',
  [
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required.')
      .isLength({ max: 255 }),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0.'),
    body('paidBy')
      .notEmpty()
      .withMessage('Payer (paidBy) is required.')
      .isUUID()
      .withMessage('paidBy must be a valid UUID.'),
    body('splitType')
      .isIn(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'])
      .withMessage('Split type must be one of: EQUAL, UNEQUAL, PERCENTAGE, SHARE.'),
    body('participants')
      .isArray({ min: 1 })
      .withMessage('At least one participant is required.'),
    body('participants.*.userId')
      .isUUID()
      .withMessage('Each participant must have a valid userId.'),
  ],
  validate,
  createExpense
);

// GET /api/groups/:groupId/expenses — List group expenses
router.get('/', getGroupExpenses);

// GET /api/expenses/:id — Get expense detail (mounted separately in index.js)
// PUT /api/expenses/:id — Update expense
// DELETE /api/expenses/:id — Delete expense

module.exports = router;

// Also export individual expense routes for separate mounting
module.exports.expenseDetailRouter = (() => {
  const detailRouter = Router();
  detailRouter.use(auth);

  detailRouter.get('/:id', getExpense);

  detailRouter.put(
    '/:id',
    [
      body('description')
        .optional()
        .trim()
        .notEmpty()
        .isLength({ max: 255 }),
      body('amount')
        .optional()
        .isFloat({ min: 0.01 }),
      body('splitType')
        .optional()
        .isIn(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE']),
    ],
    validate,
    updateExpense
  );

  detailRouter.delete('/:id', deleteExpense);

  // Comment routes nested under expenses
  detailRouter.get('/:id/comments', getComments);
  detailRouter.post(
    '/:id/comments',
    [
      body('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required.')
        .isLength({ max: 1000 })
        .withMessage('Comment must be under 1000 characters.'),
    ],
    validate,
    addComment
  );

  return detailRouter;
})();
