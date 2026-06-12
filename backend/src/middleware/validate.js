/**
 * Request validation middleware using express-validator.
 * Checks for validation errors and returns a standardized error response.
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArr = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    
    const errorMessage = errorArr.map(e => e.message).join(', ');

    return res.status(400).json({
      success: false,
      message: errorMessage,
      errors: errorArr,
    });
  }
  next();
};

module.exports = validate;
