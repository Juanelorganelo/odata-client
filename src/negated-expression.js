const Field = require('./field');
/** @typedef {import('./Field').FieldLike} FieldLike */

/**
 * Negate a boolean expression.
 */
module.exports = class NegatedExpression {
  /**
   * Creates a NegatedExpression instance.
   * @param {FieldLike} expression
   */
  constructor(expression) {
    this.expression = Field.isFieldPrimitive(expression) ? new Field(expression) : expression;
  }
};
