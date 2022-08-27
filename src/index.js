const Fn = require('./fn');
const Type = require('./type');
const Field = require('./field');
const Expression = require('./expression');
const OperatorExpression = require('./operator-expression');

const OData = module.exports;

/**
 * An object containing the available arithmetic operators.
 */
OData.Op = require('./operators');

/**
 * Type of orderings.
 */
OData.Orders = require('./orders');

/**
 * The OData error constructor.
 * Mainly for use in instanceof expressions.
 */
OData.ODataError = require('./odata-error');

/**
 * The ODataClient.
 * This will act as the entry point to the service.
 * When instantiated it will query the service root and create methods for each EntitySet.
 */
OData.createODataClient = require('./client-factory');

/**
 * Create a function.
 * @param {string} name The function name.
 * @param {*} args The arguments passed to the function.
 * @return {Fn} An OData function.
 */
OData.fn = function fn(name, ...args) {
  return new Fn(name, args);
};

/**
 * Create an OData identifier or field_path.
 * Additionally this adds the ability to nest $expand and $select clauses.
 * @param {string|string[]} name The identifier or field_path.
 * @return {Field} A Field object.
 */
OData.field = function field(name) {
  return new Field(name);
};

/**
 * Create an Edm.Guid value.
 * @param {string} value The guid's value.
 * @return {Type} An Edm.Guid value.
 */
OData.guid = function guid(value) {
  return new Type('guid', value);
};

/**
 * Create an Edm.Decimal value.
 * @param {number} value The decimal's value.
 * @return {Type} An Edm.Decimal value.
 */
OData.decimal = function decimal(value) {
  return new Type('M', value, true);
};

/**
 * Create an Edm.Single value.
 * @param {number} value The single's value.
 * @return {Type} An Edm.Single value.
 */
OData.single = function single(value) {
  return new Type('f', value, true);
};

/**
 * Create an Edm.Double value.
 * @param {number} value The double's value.
 * @return {Type} An Edm.Double value.
 */
OData.double = function double(value) {
  return new Type('d', value, true);
};

/**
 * Create an Edm.Int64 value.
 * @param {number} value The int64's value.
 * @return {Type} An Edm.Int64 value.
 */
OData.int64 = function int64(value) {
  return new Type('L', value, true);
};

/**
 * Create an Edm.DateTime value.
 * @param {Date|string} value The datetime's value.
 * @return {Type} An Edm.DateTime value.
 */
OData.datetime = function datetime(value) {
  return new Type('datetime', value);
};

/**
 * Creates a filter expression for nesting.
 * @param {string|string[]|Field} field The left operand.
 * @param {string} op The expression operator.
 * @param {string|boolean|number} value
 * @return {Expression} An Expression object.
 */
OData.expression = function expression(field, op, value) {
  const expression = new Expression();
  if (!field) {
    return expression;
  }
  return expression.append(new OperatorExpression(field, op, value));
};
