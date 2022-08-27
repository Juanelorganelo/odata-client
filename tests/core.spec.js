const nock = require('nock');
const {decimal, guid, double, int64, single, datetime, Op, createODataClient} = require('../src');

describe('core', () => {
  const url = 'https://service.odata.org/';
  const scope = nock(url);

  let client;
  beforeEach(async () => {
    scope.get('/').reply(200, [
      {
        url: 'Students',
        name: 'Students',
        kind: 'EntitySet',
      },
    ]);
    client = await createODataClient({baseURL: url});
  });

  describe('methods', () => {
    test('resource method', () => {
      expect(typeof client.students).toBe('function');
    });

    test("throws when resource doesn't exist", () => {
      expect(() => client.airports).toThrow('Invalid resource name airports');
    });

    test('caches method generation', () => {
      const method = client.students;
      expect(method).toBe(client.students);
    });

    test('accepts an primary ref to the resource', () => {
      const query = client.students(134).query();
      expect(query).toBe('/Students(134)');
    });

    test('accepts a named primary ref', () => {
      const query = client.students({acmeId: 1234}).query();
      expect(query).toBe('/Students(acmeId=1234)');
    });

    test('adds custom query parameters', () => {
      const single = client.students().custom('format', 'json').query();
      const multiple = client.students().custom({format: 'json', key: '6aggf62gf6'}).query();
      expect(single).toBe('/Students?format=json');
      expect(multiple).toBe('/Students?format=json&key=6aggf62gf6');
    });
  });

  describe('types', () => {
    // prettier-ignore
    test.each`
      name         | value                     | expected
      ${'number'}  | ${2}                      | ${'2'}
      ${'boolean'} | ${true}                   | ${'true'}
      ${'buffer'}  | ${Buffer.from('a')}       | ${"binary'61'"}
      ${'date'}    | ${new Date(2019, 12, 12)} | ${'2020-01-12T06:00:00.000Z'}
      ${'array'}   | ${[1, 2, 3, 4]}           | ${'1,2,3,4'}
      ${'string'}  | ${'foobar'}               | ${"'foobar'"}
    `('serialize builtin $name values', ({value, expected}) => {
      const query = client.students().filter('Value', Op.EQ, value).query();
      expect(query).toBe(`/Students?$filter=Value eq ${expected}`);
    });

    // prettier-ignore
    test.each`
      name          | type                               | expected
      ${'single'}   | ${single(2.3)}                     | ${'2.3f'}
      ${'decimal'}  | ${decimal(1.4)}                    | ${'1.4M'}
      ${'int64'}    | ${int64(9999999999)}               | ${'9999999999L'}
      ${'guid'}     | ${guid('x23-x24')}                 | ${"guid'x23-x24'"}
      ${'double'}   | ${double(1.23456)}                 | ${'1.23456d'}
      ${'datetime'} | ${datetime(new Date(2019, 12,12))} | ${"datetime'2020-01-12T06:00:00.000Z'"}
    `('serializes $name types', ({type, expected}) => {
      const query = client.students().filter('Name', Op.EQ, type).query();
      expect(query).toBe(`/Students?$filter=Name eq ${expected}`);
    });
  });
});
