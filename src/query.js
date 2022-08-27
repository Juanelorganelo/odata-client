const cast = require('./cast');
const Field = require('./field');
const Fn = require('./fn');
const Path = require('./path');
const Lambda = require('./lambda');
const Expression = require('./expression');

const DEFAULT_PAGINATION_TOP = 500;

/**
 * An OData entity set.
 */
module.exports = class Query {
  /**
   * Create an EntitySet object.
   * @param {object} options EntitySet options.
   * @param {string} options.name The URL name of the entity set.
   * @param {object} options.client The HTTP client used to communicate with the API.
   * @param {string|number} [options.primaryRef] A primaryRef identifying a resource in the set.
   */
  constructor({name, client, primaryRef}) {
    this._path = new Path();
    this._client = client;

    if (primaryRef == null) {
      this._path.addPathComponent(name);
    } else if (typeof primaryRef === 'object') {
      const [key] = Object.keys(primaryRef);
      this._path.addPathComponent(`${name}(${key}=${encodeURIComponent(cast(primaryRef[key]))})`);
    } else {
      this._path.addPathComponent(`${name}(${encodeURIComponent(cast(primaryRef))})`);
    }
  }

  /**
   * Creates an iterator that iterates through paginated responses of resource.
   * If no top was set before the iteration, it defaults to 500.
   */
  async *[Symbol.asyncIterator]() {
    let page = 0;
    let remaining = await this.count();

    let top;
    if (this._top) {
      top = this._top;
    } else {
      top = DEFAULT_PAGINATION_TOP;
      this.top(top);
    }

    while (remaining > 0) {
      yield await this.fetch();
      page += 1;
      remaining -= top;
      this.skip(page * top);
    }
  }

  /**
   * Query the top `top` entries.
   * @param {number} top The number of entries to query.
   * @return {this} The EntitySet instance.
   */
  top(top) {
    if (top <= 0) {
      throw new Error(`A top clause must use a number strictly greater than 0`);
    }

    this._top = top;
    return this;
  }

  /**
   * Skip the first `skip` entries.
   * @param {number} skip Number of entries to skip.
   * @return {this} The EntitySet instance.
   */
  skip(skip) {
    if (skip < 0) {
      throw new Error(`A skip clause must use a number greater than 0`);
    }
    this._skip = skip;
    return this;
  }

  /**
   * Filter the collection.
   * For more information see https://www.odata.org/documentation/odata-version-2-0/uri-conventions/#_45_filter_system_query_option_filter_13.
   * @param {string} field The field of the resource to operate on.
   * @param {symbol} op The operator to use.
   * @param {string|number|boolean} value The value to pass to the operator.
   * @return {this} The OData query instance.
   */
  filter(field, op, value) {
    this._filter = new Expression().append(field, op, value);
    return this;
  }

  /**
   * Chain a filter condition using the and operator.
   * @param {string} field Field to operate on.
   * @param {symbol} op Filter operator.
   * @param {string|number|boolean} value Operator argument.
   * @return {this} The OData query instance.
   */
  and(field, op, value) {
    if (this._filter) {
      this._filter = this._filter.and(field, op, value);
    } else {
      this._filter = new Expression().append(field, op, value);
    }
    return this;
  }

  /**
   * Chain a filter condition using the or operator.
   * @param {string} field Field to operate on.
   * @param {symbol} op Filter operator.
   * @param {string|number|boolean} value Operator argument.
   * @return {this} The OData query instance.
   */
  or(field, op, value) {
    if (this._filter) {
      this._filter = this._filter.or(field, op, value);
    } else {
      this._filter = new Expression().append(field, op, value);
    }
    return this;
  }

  /**
   * Adds an all filter.
   * @param {string|string[]|Field} collection The collection field.
   * @param {string|string[]|Field} field Field name of the collection's item.
   * @param {Operators} op The operator.
   * @param {Value} value The right operands value.
   * @return {Query} The OData instance.
   */
  all(collection, field, op, value) {
    this.filter(new Lambda('all', collection, field, op, value));
    return this;
  }

  /**
   * Adds an all filter.
   * @param {string|string[]|Field} collection The collection field.
   * @param {string|string[]|Field} field Field name of the collection's item.
   * @param {Operators} op The operator.
   * @param {Value} value The right operands value.
   * @return {Query} The OData instance.
   */
  any(collection, field, op, value) {
    this.filter(new Lambda('any', collection, field, op, value));
    return this;
  }

  /**
   * Select which fields of the resource to retrive.
   * If select is called, only fields specified in select calls will be fetched.
   * @param  {...string} fields Fields to retrive.
   * @return {this} The OData instance.
   */
  select(...fields) {
    this._select = this._select || [];
    Array.prototype.push.apply(this._select, fields);
    return this;
  }

  /**
   * Count all the resources in a set.
   * @return {Promise<number>} The OData instance.
   */
  async count() {
    const query = this.build().clone().addPathComponent('$count').toString();
    const response = await this._client.get(query);
    return parseInt(response.data, 10);
  }

  /**
   * Sort the query results.
   * @param  {...([string] | [string, string])} orders A list of tuples representing a field and an order operator.
   * If the order operator is missing, the items will be sorted in ascending order.
   * @return {this} The OData instance.
   * @example
   * client.orderBy(['Id']) // Will sort by Id in ascending order.
   * client.orderBy(['Id', OData.Operators.DESC]) // Will sort by Id in descending order.
   * // More complex sorts are also possible.
   * client.orderBy(['Id'], ['Email', OData.Operators.DESC])
   */
  orderBy(...orders) {
    this._order = this._order || [];

    const add = (item, order) => {
      if (item instanceof Fn) {
        this._order.push(item + (order ? ` ${order}` : ''));
      } else {
        this._order.push(new Field(item) + (order ? ` ${order}` : ''));
      }
    };

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

      if (Array.isArray(order)) {
        if (order.length > 2) {
          throw new Error(`Invalid order query ${order}`);
        }

        const [field, direction] = order;
        add(field, direction);
      } else {
        add(order);
      }
    }

    return this;
  }

  /**
   * Adds an property to $expand.
   * @param  {...string[]} args List of properties to expand.
   * @return {this} The OData instance.
   */
  expand(...args) {
    this._expand = this._expand || [];
    Array.prototype.push.apply(this._expand, args);
    return this;
  }

  /**
   * Adds custom query parameters to the query.
   * @param {string} name The name of the parameter.
   * @param {string|number|boolean} value The value of the parameter.
   * @return {this} The OData instance.
   */
  custom(name, value) {
    this._path.addQueryParameter(name, value);
    return this;
  }

  /**
   * Send the query to the OData server.
   * @return {object|number} The result of the query as a JS object or a number when sending a $count query.
   */
  async fetch() {
    const query = this.query();
    const response = await this._client.get(query);
    return response.data;
  }

  /**
   * Get the request path.
   * @return {string} The request path as a string.
   */
  query() {
    return this.build().toString();
  }

  /**
   * Build the request path.
   * @return {Path} A path object.
   * @private
   */
  build() {
    if (this._top) {
      this._path.addQueryParameter('$top', this._top);
    }
    if (this._skip) {
      this._path.addQueryParameter('$skip', this._skip);
    }
    if (this._filter != null) {
      this._path.addQueryParameter('$filter', this._filter.toString());
    }
    if (this._select) {
      this._path.addQueryParameter('$select', this._select.join(','));
    }
    if (this._expand) {
      this._path.addQueryParameter('$expand', this._expand.join(','));
    }
    if (this._search) {
      this._path.addQueryParameter('$search', this._search);
    }
    if (this._order != null) {
      this._path.addQueryParameter('$orderby', this._order.join(','));
    }
    return this._path;
  }
};
