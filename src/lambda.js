const Field = require('./field');
const validation = require('./validations');

/**
 * An OData Lambda function.
 */
module.exports = class Lambda {
  /**
   * Create a Lambda instance.
   * @param {'any'|'all'} type The type of Lambda function filter to use.
   * @param {string} collection The name of the collection to use the Lambda in.
   * @param {string|string[]|Fn|Lambda|OperatorExpression} field The field the Lambda expression will operate on. This will be passed to an Expression.
   * @param {string} op Operator to use in the expression.
   * @param {string|boolean|number|null|Date|Buffer|Type|Field|Fn|OperatorExpression} value The literal the operator will act on.
   */
  constructor(type, collection, field, op, value) {
    validation.validateField(collection);

    this.type = type;
    this.collection = Field.isFieldPrimitive(collection) ? new Field(collection) : collection;
    this.field = Field.isFieldPrimitive(field) ? new Field(field) : field;
    this.op = op;
    this.value = value;
  }
};
