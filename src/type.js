const cast = require('./cast');

/**
 * @typedef {import('./cast').Literal} Literal
 */

/**
 * Represents an OData typed value.
 */
module.exports = class Type {
  /**
   * Create a Type instance.
   * @param {string} type The type symbol.
   * @param {Literal} value Typed value.
   * @param {boolean} suffix True if the type is appended as a suffic to the value.
   */
  constructor(type, value, suffix = false) {
    this._type = type;
    this._value = value;
    this._suffix = suffix;
  }

  /**
   * Convert the typed value to an OData string.
   * @return {string} OData typed value.
   */
  toString() {
    if (this._suffix) {
      return `${cast(this._value)}${this._type}`;
    }
    return `${this._type}'${cast(this._value, true, true)}'`;
  }
};
