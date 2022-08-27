const nock = require('nock');
const OData = require('../src');
const ODataError = require('../src/odata-error');

describe('errors', () => {
  const url = 'https://service.odata.org/';
  const scope = nock(url);

  test('throws if the baseURL is not present', () => {
    return expect(() => OData.createODataClient({})).rejects.toThrow(
      'The baseURL option is required',
    );
  });

  test.each`
    status | expected
    ${500} | ${'Request failed with status code 500'}
    ${400} | ${'Request failed with status code 400'}
  `('throws when response status is "$status"', ({status, expected}) => {
    // Arrange.
    scope.get('/').reply(status);

    // Act.
    const fn = () =>
      OData.createODataClient({
        baseURL: url,
      });

    // Assert.
    return expect(fn).rejects.toThrow(expected);
  });

  test('throws an ODataError', async (done) => {
    // Arrange.
    scope.get('/').reply(400);

    // Act.
    try {
      await OData.createODataClient({
        baseURL: url,
      });
      done.fail("Request didn't throw");
    } catch (e) {
      // Assert.
      expect(e).toBeInstanceOf(OData.ODataError);
      done();
    }
  });

  test('attaches the request error message', () => {
    // Arrange
    scope.get('/').reply(400, {
      error: {
        message: 'Invalid URL query',
      },
    });

    // Act.
    const fn = () =>
      OData.createODataClient({
        baseURL: url,
      });

    // Assert.
    return expect(fn).rejects.toThrow('Invalid URL query');
  });

  test('throws if server responds with a different content-type', () => {
    scope.get('/').reply(200, `<h1>Sup</h1>`, {
      'Content-Type': 'text/html',
    });

    const fn = () => OData.createODataClient({baseURL: url});
    return expect(fn).rejects.toThrow(ODataError, `Received invalid Content-Type text/html`);
  });
});
