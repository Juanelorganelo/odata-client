const axios = require('axios');
const camelcase = require('camelcase');
const get = require('lodash/get');
const Query = require('./query');
const ODataError = require('./odata-error');

/**
 * Creates an ClientFactory service.
 * @param {object} options Axios options.
 * @return {object} The ClientFactory service object.
 */
module.exports = async function createODataClient(options) {
  const client = createClient(options);
  // Query the ClientFactory service root.
  const response = await client.get('/');
  const entitySets = createEntitySetMap(response.data);

  const service = {};
  // Create a proxy to lazily generate resource properties.
  return new Proxy(service, {
    get: (target, property) => {
      // Node.js accesses the `then` property of a value returned by a promise.
      // It does this to check if the value is `thenable`.
      if (property === 'then') return;

      // If the property already exists just return it.
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property);
      }

      // If the property doesn't exists, check if a resource with that name exists.
      // if it doesn't exists throw an error to detect typos quicker.
      if (!Reflect.has(entitySets, property)) {
        throw new TypeError(`Invalid resource name ${property}`);
      }

      const url = Reflect.get(entitySets, property);
      const value = (primaryRef) =>
        new Query({
          client,
          primaryRef,
          name: url,
        });

      Object.defineProperty(service, property, {value});

      return value;
    },
  });
};

/**
 * Create an axios instance with some modified stuff.
 * @param {object} options Axios options.
 * @return {object} The axios client.
 * @private
 */
function createClient(options) {
  if (!options.baseURL) {
    throw new TypeError(`The baseURL option is required as this will be used as the service root`);
  }

  const client = axios.create({
    ...options,
    headers: {
      ...(options.headers || {}),
      Accept: 'application/json,text/plain',
    },
  });

  client.interceptors.response.use(
    (response) => {
      const contentType = response.headers['content-type'];

      if (isCountRequest(axios.getUri(response.config))) {
        if (contentType !== 'text/plain' && !contentType.startsWith('application/json')) {
          throw new ODataError(`Invalid content type for $count request ${contentType}`);
        }
      } else if (!contentType.startsWith('application/json')) {
        throw new ODataError(`Invalid content type ${contentType}`);
      }

      return Object.assign(response, {data: get(response, 'data.value', response.data)});
    },
    (error) => {
      let message;
      if (error.response) {
        message = get(error.response, 'data.error.message', error.message);
      } else if (!message) {
        message = error.message;
      }

      return Promise.reject(new ODataError(message));
    },
  );

  return client;
}

/**
 * Create a map from the ClientFactory service root response.
 * @param {object[]} entitySets The entity set list returned by the service root.
 * @return {object<string, string>} An object mapping an entity set's name in camelcase to it's url.
 * @private
 */
function createEntitySetMap(entitySets) {
  return entitySets.reduce((acc, {name, url}) => ({...acc, [camelcase(name)]: url}), {});
}

/**
 * Checks if a request was a $count request.
 * @param {string} url The axios request config.
 * @return {boolean} True if the request had a $count parameter.
 * @private
 */
function isCountRequest(url) {
  return url.indexOf('$count') >= 0 || url.indexOf('%24count') >= 0;
}
