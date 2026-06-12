/**
 * Helper utilities for SplitBuddy backend.
 */

/**
 * Wraps an async route handler to catch errors and pass to Express error handler.
 * Eliminates try/catch boilerplate in every controller.
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Standard success response format.
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message - Optional message
 */
const sendSuccess = (res, data, statusCode = 200, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Round a number to 2 decimal places (for currency).
 * @param {number} num
 * @returns {number}
 */
const roundCurrency = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

module.exports = {
  asyncHandler,
  sendSuccess,
  roundCurrency,
};
