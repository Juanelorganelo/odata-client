const Field = require('./field');

/**
 * A class to represent a filter expression.
 */
module.exports = class OperatorExpression {
  /**
   * An object to represent OData expressions.
   *
   * @param {string|string[]|Fn|Lambda|OperatorExpression} field The field the expression will operate on.
   * @param {string} op The expression operator.
   * @param {string|boolean|number|null|Date|Buffer|Type|Field|Fn|OperatorExpression} value The operator argument.
   * i.e. surrounded by parenthesis.
   */
  constructor(field, op, value) {
    this.field = Field.isFieldPrimitive(field) ? new Field(field) : field;
    this.op = op;
    this.value = value;
  }
};
