/**
 * JWT Authentication Middleware.
 * Verifies the Bearer token from the Authorization header and attaches user to req.
 */

const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { UnauthorizedError } = require('../utils/errors');

const auth = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (ensures user still exists)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User no longer exists.');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token.'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired. Please log in again.'));
    } else {
      next(error);
    }
  }
};

module.exports = auth;
