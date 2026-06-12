/**
 * Group Routes — /api/groups
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
} = require('../controllers/groupController');

const router = Router();

// All group routes require authentication
router.use(auth);

// POST /api/groups — Create a group
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Group name is required.')
      .isLength({ min: 1, max: 100 })
      .withMessage('Group name must be 1-100 characters.'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be under 500 characters.'),
  ],
  validate,
  createGroup
);

// GET /api/groups — List user's groups
router.get('/', getGroups);

// GET /api/groups/:id — Get group details
router.get('/:id', getGroup);

// PUT /api/groups/:id — Update group
router.put(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Group name cannot be empty.')
      .isLength({ max: 100 }),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }),
  ],
  validate,
  updateGroup
);

// DELETE /api/groups/:id — Delete group
router.delete('/:id', deleteGroup);

// POST /api/groups/:id/members — Add member by email
router.post(
  '/:id/members',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email.')
      .normalizeEmail(),
  ],
  validate,
  addMember
);

// DELETE /api/groups/:id/members/:userId — Remove member
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
