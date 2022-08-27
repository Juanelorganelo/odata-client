const {createODataTestClient} = require('./support/mocks/odata');
const {Orders, fn, field, expression, Op} = require('../src');

describe('ordering', () => {
  let client;
  beforeEach(async () => {
    client = await createODataTestClient({
      baseURL: 'https://service.odata.com/',
      fixtures: {
        root: {
          body: [
            {
              name: 'Students',
              url: 'Students',
            },
          ],
        },
      },
    });
  });

  test('order by identifier', () => {
    const query = client.students().orderBy('Age').query();
    expect(query).toBe('/Students?$orderby=Age');
  });

  test('order by field path', () => {
    const query = client
      .students()
      .orderBy([['Campus', 'Code'], Orders.DESC])
      .query();
    expect(query).toBe('/Students?$orderby=Campus/Code desc');
  });

  test('order by function result', () => {
    const query = client
      .students()
      .orderBy(fn('search', field('City'), 'San'))
      .query();
    expect(query).toBe("/Students?$orderby=search(City,'San')");
  });

  test('order by arithmetic operation', () => {
    const query = client.students().orderBy(expression('Age', Op.MUL, 0.5)).query();
    expect(query).toBe('/Students?$orderby=Age mul 0.5');
  });

  test('order by function and operator', () => {
    const query = client
      .students()
      .orderBy(expression(fn('score', field('Name')), Op.MUL, 0.5))
      .query();
    expect(query).toBe('/Students?$orderby=score(Name) mul 0.5');
  });

  test('multiple orderings', () => {
    const query = client
      .students()
      .orderBy([fn('score', field('Name')), Orders.DESC], ['Grade'])
      .query();
    expect(query).toBe('/Students?$orderby=score(Name) desc,Grade');
  });

  test('throws when an invalid order array is passed', () => {
    const query = client.students();
    expect(() => query.orderBy(['Clause', Orders.DESC, 'foo'])).toThrow('Invalid order');
  });
});
