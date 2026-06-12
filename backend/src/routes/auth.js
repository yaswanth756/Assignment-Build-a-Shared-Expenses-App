/**
 * Auth Routes — /api/auth
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required.')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
  ],
  validate,
  login
);

// GET /api/auth/me
router.get('/me', auth, getMe);

module.exports = router;
