const nock = require('nock');
const {createODataClient} = require('../../../src');

/**
 * @typedef {object} Fixture A fixture object.
 * @property {string|Buffer|Function} body The response body.
 * @property {object<string, string>} headers The response headers.
 * @property {number} status The response's HTTP status code.
 */

const defaultHeaders = {
  'Content-Type': 'application/json; odata.metadata=minimal',
};

/**
 * Mock module for the OData module.
 */
module.exports = {
  /**
   * An object that creates OData services using a as a service root.
   * @param {object} options Method options.
   * @param {object} options.fixtures An object of fixtures to use in HTTP requests.
   * @param {object} options.fixtures.root The fixture
   */
  async createODataTestClient({fixtures, ...options}) {
    if (!fixtures.root) {
      throw new Error(`A \`root\` fixture must be provided to create the test service`);
    }

    const {body, headers = {}, status = 200} = fixtures.root;
    const scope = nock(options.baseURL)
      .get('/')
      .reply(status, body, {...defaultHeaders, ...headers});

    const service = await createODataClient(options);
    scope.done();
    return service;
  },
};
