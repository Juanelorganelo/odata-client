/** @typedef {(string|string[]|Field)} FieldLike */

/**
 * An OData identifier or field path.
 */
module.exports = class Field {
  /**
   * Check if a value is a field primitive.
   * @param {*} value Value to check.
   * @return {boolean} True if the value is a field primitive.
   */
  static isFieldPrimitive(value) {
    return (
      typeof value === 'string' ||
      (Array.isArray(value) && value.every((v) => typeof v === 'string'))
    );
  }

  /**
   * Create a field instance.
   * @param {string|string[]} value The value of the field.
   * Strings will be treated as identifiers and arrays as field paths.
   */
  constructor(value) {
    this.value = value;
  }

  /**
   * Expand properties of a navigation property.
   * Can only be used if this instance is an identifier.
   * @param {...(string|Field)} fields List of strings or Field objects.
   * @return {Field} The field instance.
   */
  expand(...fields) {
    this._validateClauseUsage();
    this.expanded = fields;
    return this;
  }

  /**
   * Select properties of a navigation property.
   * Can only be used if this instance is an identifier.
   * @param {...(string|Field)} fields List of strings or Field objects.
   * @return {Field} The field instance.
   */
  select(...fields) {
    this._validateClauseUsage();
    this.selected = fields;
    return this;
  }

  /**
   * Get the last field on a field path.
   * @return {string} Last field.
   */
  terminal() {
    if (typeof this.value === 'string') {
      return this.value;
    }
    return this.value.slice(-1);
  }

  /**
   * Add an identifier to the beginning of the field.
   * @param {string} identifier The identifier to add.
   */
  prepend(identifier) {
    if (Array.isArray(this.value)) {
      this.value.unshift(identifier);
    } else {
      this.value = [identifier, this.value];
    }
  }

  /**
   * Serialize the field to an OData identifier
   * (optionally with $expand and $select clauses) or a field path.
   * @return {string} The OData identifier or field path.
   */
  toString() {
    let value = this.value;

    if (Array.isArray(this.value)) {
      value = this.value.join('/');
    }

    if (this.selected) {
      value += `($select=${this.selected.join(',')}`;
    }

    if (this.expanded) {
      value += this.selected
        ? `;$expand=${this.expanded.join(',')})`
        : `($expand=${this.expanded.join(',')})`;
    } else if (this.selected) {
      value += ')';
    }

    return typeof value === 'string' ? value : value.toString();
  }

  /**
   * Check that $expand and $select clauses are only being used on identifiers.
   * @private
   */
  _validateClauseUsage() {
    if (Array.isArray(this.value)) {
      throw new Error(`Nested path on expanded identifier "${this.value.join('/')}"`);
    }
  }
};
