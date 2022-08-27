/**
 * An error thrown when a request to the OData service fails.
 */
module.exports = class ODataError extends Error {
  /**
   * Creates an ODataError instance.
   * @param {string} message The error message.
   */
  constructor(message) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
};
