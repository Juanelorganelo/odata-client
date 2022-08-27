const qs = require('querystring');
const isPlainObject = require('lodash/isPlainObject');

/**
 * Creates an object to manipulate URL paths (with query parameters).
 */
module.exports = class Path {
  /**
   * Create a Path instance.
   */
  constructor() {
    this._path = [];
    this._query = {};
  }

  /**
   * Add a path segment.
   * @param {string} component Path segment to add.
   * @return {Path} The Path instance.
   */
  addPathComponent(component) {
    this._path.push(component);
    return this;
  }

  /**
   * Adds a query parameter.
   * @param {string} name Name of the query parameter.
   * @param {string|number|boolean} value The parameter value.
   * @return {Path} The Path instance.
   */
  addQueryParameter(name, value) {
    if (isPlainObject(name)) {
      Object.assign(this._query, name);
    } else {
      this._query[name] = value;
    }
    return this;
  }

  /**
   * Creates a new Path instance with identical values.
   * @return {Path} The new path instance.
   */
  clone() {
    const path = new Path();
    path._path = [...this._path];
    path._query = {...this._query};
    return path;
  }

  /**
   * Transform the path to a string.
   * @return {string}
   */
  toString() {
    const path = this._path.join('/');
    const search = qs.stringify(this._query);

    let formatted = `/${path}`;
    if (search) {
      formatted += `?${qs.unescape(search)}`;
    }
    return formatted;
  }
};
