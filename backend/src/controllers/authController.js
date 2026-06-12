/**
 * Auth Controller — Handles registration, login, and profile retrieval.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { BadRequestError, ConflictError } = require('../utils/errors');

/**
 * POST /api/auth/register
 * Register a new user with name, email, and password.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  sendSuccess(res, { user, token }, 201, 'Account created successfully.');
});

/**
 * POST /api/auth/login
 * Login with email and password, returns JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new BadRequestError('Invalid email or password.');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new BadRequestError('Invalid email or password.');
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  sendSuccess(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  }, 200, 'Login successful.');
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile.
 */
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user });
});

module.exports = {
  register,
  login,
  getMe,
};
