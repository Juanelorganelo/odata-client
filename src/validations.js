const Field = require('./field');

const validations = module.exports;

/**
 * Check that a value is a field or field-like.
 * @param {*} value Value to check.
 * @throws {Error} When the value is not a field or field-like.
 */
validations.validateField = function validateField(value) {
  if (!Array.isArray(value) && typeof value !== 'string' && !(value instanceof Field)) {
    throw new Error(`Invalid field ${value}`);
  }
};
