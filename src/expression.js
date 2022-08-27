const camelcase = require('camelcase');
const {singular} = require('pluralize');
const cast = require('./cast');
const Fn = require('./fn');
const Field = require('./field');
const Lambda = require('./lambda');
const Operators = require('./operators');
const NegatedExpression = require('./negated-expression');
const OperatorExpression = require('./operator-expression');

/**
 * @typedef {boolean|number|string|null} Primitive
 */
/**
 * @typedef {Primitive|Primitive[]|Date|Buffer|Field|Lambda|Fn|Expression} Value
 */

/**
 * An OData expression.
 */
module.exports = class Expression {
  /**
   * Create an Expression.
   */
  constructor() {
    this.expressions = [];
  }

  /**
   * Serialize the Expression to an OData $filter expression.
   * @return {string} The serialized expression chain.
   */
  toString() {
    return this.expressions.map((expression) => this.serialize(expression)).join(' ');
  }

  /**
   * Not operator.
   * @param {string|string[]|Field|Expression|Fn} expression Expression to negate.
   * @return {Expression} The Expression instance.
   */
  /**
   * Not operator.
   * @param {string|string[]} field The left operand of the expression.
   * @param {string} op The operator.
   * @param {Value} value The right operand of the expression.
   * @return {Expression} The Expression instance.
   */
  not(field, op, value) {
    if (op === undefined) {
      return this.append(new NegatedExpression(field));
    } else {
      return this.append(new NegatedExpression(new OperatorExpression(field, op, value)));
    }
  }

  /**
   * Nest filter expression using the and operator.
   * @param {string} field Nested expression field.
   * @param {symbol} op Nested expression operator.
   * @param {string} value Nested expression value.
   * @return {Expression} The expression instance.
   */
  and(field, op, value) {
    if (this.expressions.length > 0) {
      const prev = this.expressions.pop();
      return this.append(prev, Operators.AND, new OperatorExpression(field, op, value));
    } else {
      return this.append(field, op, value);
    }
  }

  /**
   * Nest filter expression using the or operator.
   * @param {string} field Nested expression field.
   * @param {symbol} op Nested expression operator.
   * @param {string} value Nested expression value.
   * @return {Expression} The expression instance.
   */
  or(field, op, value) {
    if (this.expressions.length > 0) {
      const prev = this.expressions.pop();
      return this.append(prev, Operators.OR, new OperatorExpression(field, op, value));
    } else {
      return this.append(field, op, value);
    }
  }

  /**
   * Append an expression to the chain.
   * @param {string|string[]|Field} field The resource field.
   * @param {Operators} op The expression operator.
   * @param {Literal} value The constant operand of the expression.
   * @return {Expression} The expression chain instance.
   */
  append(field, op, value) {
    if (op === undefined) {
      this.expressions.push(field);
    } else if (value === undefined) {
      if (field === Operators.NOT) {
        this.expressions.push(new NegatedExpression(op));
      } else {
        throw new Error(`\`not\` expressions must begin with the \`Op.NOT\` operator`);
      }
    } else {
      this.expressions.push(new OperatorExpression(field, op, value));
    }
    return this;
  }

  /**
   * Serialize an expression into a string.
   * @param {*} expr Expression to serialize.
   * @return {string} Serialized expression.
   * @private
   */
  serialize(expr) {
    if (expr instanceof OperatorExpression) {
      let left;
      if (this.isSerializable(expr.field)) {
        left = this.serialize(expr.field);
      } else {
        left = cast(expr.field, true, true);
      }

      // No operator means no value.
      if (expr.op == null) return left.toString();

      // Serialize the IN operator.
      if (expr.op === Operators.IN) {
        let {value} = expr;
        if (!Array.isArray(value)) {
          value = [value];
        }

        return `${left} in (${cast(value)})`;
      }

      let right;
      if (this.isSerializable(expr.value)) {
        right = this.serialize(expr.value);
      } else {
        right = cast(expr.value);
      }

      return `${left} ${expr.op} ${right}`;
    }
    // not <expression>
    if (expr instanceof NegatedExpression) {
      let {expression} = expr;
      if (this.isSerializable(expression)) {
        expression = this.serialize(expression);
      } else {
        expression = cast(expression, false, true);
      }
      return `${Operators.NOT} ${expression}`;
    }
    // Fn e.g. score(Assessment)
    if (expr instanceof Fn) {
      const args = expr.args.map((arg) =>
        this.isSerializable(arg) ? this.serialize(arg) : cast(arg),
      );
      return `${expr.name}(${args.join(',')})`;
    }
    // Lambdas e.g. (room: room/Code eq 'X23')
    if (expr instanceof Lambda) {
      const {type, collection, field, op, value} = expr;
      // any/all filters operate on items of a collection.
      // so the lambda variable will be the singular of that collection.
      const variable = singular(camelcase(collection.terminal()));

      let expression = op === undefined ? field : new OperatorExpression(field, op, value);

      // Append the variable name to the fields of the lambda expression.
      if (expression instanceof OperatorExpression) {
        expression.field.prepend(variable);
      } else if (expression instanceof Fn) {
        expression.args = expression.args.map((arg) => {
          if (arg instanceof Field) {
            arg.prepend(variable);
          }
          return arg;
        });
      }

      if (this.isSerializable(expression)) {
        expression = this.serialize(expression);
      }

      return `${collection}/${type}(${variable}: ${expression})`;
    }
    // Expression e.g. Age gt 29 and Score gt 5
    if (expr instanceof Expression) {
      return `(${expr})`;
    }
    // Nested expression chain e.g. (Age eq 5 or Age eq 3 or Age eq 5)
    if (typeof expr === 'function') {
      const expression = expr(new Expression());
      return this.serialize(expression);
    }
    // Cast the value as a literal.
    return cast(expr);
  }

  /**
   * Check if the given expression is serializable.
   * @param {*} expression Expression to check.
   * @return {boolean} True if the expression can be serialized.
   */
  isSerializable(expression) {
    return (
      expression instanceof Fn ||
      expression instanceof Lambda ||
      expression instanceof NegatedExpression ||
      expression instanceof OperatorExpression ||
      expression instanceof Expression ||
      typeof expression === 'function'
    );
  }
};
