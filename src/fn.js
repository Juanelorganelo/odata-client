const cast = require('./cast');

/**
 * An OData function. (named)
 */
module.exports = class Fn {
  /**
   * Create a Fn instance.
   * @param {string} name The function name.
   * @param {Array<string|number|boolean|Fn>} args The arguments to the function.
   */
  constructor(name, args) {
    this.name = name;
    this.args = args;
  }

  /**
   * Serialize into an OData function string.
   * @return {string} OData function string.
   */
  toString() {
    return `${this.name}(${cast(this.args)})`;
  }
};
