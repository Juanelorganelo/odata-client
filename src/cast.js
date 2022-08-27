const Field = require('./field');

/**
 * @typedef {string|boolean|number|null|Date|Array|Buffer|Field|Lambda|Fn|Expression} Literal
 */

/**
 * Convert a JS value to an OData value, expression or function.
 * @param {string|boolean|number|null|Date|Array|Buffer|Field|Lambda|Fn|Expression} value The value to be serialized.
 * @param {boolean} treatStringsAsIdentifiers A flag indicating if a string should be treated as an identifier.
 * @param {boolean} treatArraysAsFieldPaths A flag indication if an array should be treated as a field path.
 * @return {string} A string representing an OData literal type.
 */
module.exports = function cast(
  value,
  treatStringsAsIdentifiers = false,
  treatArraysAsFieldPaths = false,
) {
  if (typeof value === 'string') {
    const escaped = value.replace(/'/, "''");
    return treatStringsAsIdentifiers ? escaped : `'${escaped}'`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return treatArraysAsFieldPaths
      ? new Field(value).toString()
      : value.map((v) => cast(v)).join(',');
  }

  if (Buffer.isBuffer(value)) {
    return `binary'${value.toString('hex')}'`;
  }

  if (value === null) {
    return 'null';
  }

  return value.toString();
};
