const {createODataTestClient} = require('./support/mocks/odata');

describe('pagination', () => {
  let client;
  beforeEach(async () => {
    client = await createODataTestClient({
      baseURL: 'https://service.odata.com/',
      fixtures: {
        root: {
          body: [
            {
              url: 'Students',
              name: 'Students',
              kind: 'EntitySet',
            },
          ],
        },
      },
    });
  });

  describe('top', () => {
    test.each`
      top    | expected
      ${100} | ${'/Students?$top=100'}
    `('cap $top items', ({top, expected}) => {
      const query = client.students().top(top).query();
      expect(query).toBe(expected);
    });

    test.each`
      top    | skip   | expected
      ${100} | ${200} | ${'/Students?$top=100&$skip=200'}
      ${100} | ${0}   | ${'/Students?$top=100'}
    `('cap $top items skipping $skip', ({top, skip, expected}) => {
      const query = client.students().top(top).skip(skip).query();
      expect(query).toBe(expected);
    });

    test('throws on non-positive numbers', () => {
      expect(() => client.students().top(-50)).toThrow(
        'A top clause must use a number strictly greater than 0',
      );
      expect(() => client.students().top(0)).toThrow(
        'A top clause must use a number strictly greater than 0',
      );
    });
  });

  describe('skip', () => {
    test.each`
      skip   | expected
      ${100} | ${'/Students?$skip=100'}
      ${0}   | ${'/Students'}
    `('skips the first $skip items', ({skip, expected}) => {
      const query = client.students().skip(skip).query();
      expect(query).toBe(expected);
    });
  });

  describe('iteration', () => {
    test('implements the async iterator protocol', () => {
      const students = client.students();
      expect(typeof students[Symbol.asyncIterator]).toBe('function');
    });

    test('throws on non-positive numbers', () => {
      expect(() => client.students().skip(-50)).toThrow(
        'A skip clause must use a number greater than 0',
      );
      expect(() => client.students().skip(0)).not.toThrow(
        'A skip clause must use a number greater than 0',
      );
    });
  });
});
