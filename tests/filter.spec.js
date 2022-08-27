const {Op, expression, fn, field} = require('../src');
const {createODataTestClient} = require('./support/mocks/odata');

describe('filtering', () => {
  let client;
  beforeEach(async () => {
    client = await createODataTestClient({
      baseURL: 'https://service.odata.org/',
      fixtures: {
        root: {
          body: [
            {
              url: 'Students',
              name: 'Students',
            },
            {
              url: 'Courses',
              name: 'Courses',
            },
          ],
        },
      },
    });
  });

  describe('comparisons', () => {
    // prettier-ignore
    test.each`
      field          | operator | value                                    | expected
      ${'Code'}      | ${Op.EQ} | ${'LAM'}                                 | ${'/Students?$filter=Code eq \'LAM\''}
      ${'Code'}      | ${Op.NE} | ${null}                                  | ${'/Students?$filter=Code ne null'}
      ${'Age'}       | ${Op.GT} | ${1.8}                                   | ${'/Students?$filter=Age gt 1.8'}
      ${'Age'}       | ${Op.LT} | ${80}                                    | ${'/Students?$filter=Age lt 80'}
      ${'Age'}       | ${Op.GE} | ${-18}                                   | ${'/Students?$filter=Age ge -18'}
      ${'Age'}       | ${Op.LE} | ${80}                                    | ${'/Students?$filter=Age le 80'}
      ${'Code'}      | ${Op.IN} | ${['LAM', 'EXT']}                        | ${'/Students?$filter=Code in (\'LAM\',\'EXT\')'}
      ${'CreatedAt'} | ${Op.GE} | ${new Date(2012, 3, 5)} | ${'/Students?$filter=CreatedAt ge 2012-04-05T05:00:00.000Z'}
    `(
      '"$operator" expressions',
      ({field, operator, value, expected}) => {
        const query = client.students().filter(field, operator, value).query();
        expect(query).toBe(expected);
      },
    );

    test('nested property expressions', () => {
      const query = client.students().filter(['Campus', 'Code'], Op.EQ, 'LAM').query();
      expect(query).toBe("/Students?$filter=Campus/Code eq 'LAM'");
    });
  });

  describe('logical', () => {
    test('"and" expressions', () => {
      const query = client
        .courses()
        .filter('DeliveryMethodId', Op.GT, 5)
        .and('CourseCode', Op.EQ, 'ELE')
        .query();
      expect(query).toBe("/Courses?$filter=DeliveryMethodId gt 5 and CourseCode eq 'ELE'");
    });

    test('"or" expressions`', () => {
      const query = client
        .courses()
        .filter('DeliveryMethodId', Op.GT, 5)
        .or('CourseCode', Op.EQ, 'ELE')
        .query();
      expect(query).toBe("/Courses?$filter=DeliveryMethodId gt 5 or CourseCode eq 'ELE'");
    });

    test('multiple "or" expressions', () => {
      const query = client
        .courses()
        .filter('DeliveryMethodId', Op.GT, 5)
        .or('Code', Op.EQ, 'ELE')
        .or('Code', Op.EQ, 'EXT')
        .or('Code', Op.EQ, 'TL')
        .query();
      expect(query).toBe(
        '/Courses?$filter=DeliveryMethodId gt 5' +
          " or Code eq 'ELE'" +
          " or Code eq 'EXT'" +
          " or Code eq 'TL'",
      );
    });

    test('multiple "and" expressions', () => {
      const query = client
        .courses()
        .filter('DeliveryMethodId', Op.GT, 5)
        .and('Code', Op.EQ, 'ELE')
        .and('CampusId', Op.EQ, 1)
        .and('LmsVendor', Op.EQ, 'CK')
        .query();
      expect(query).toBe(
        '/Courses?$filter=DeliveryMethodId gt 5' +
          " and Code eq 'ELE'" +
          ' and CampusId eq 1' +
          " and LmsVendor eq 'CK'",
      );
    });

    test('nested "or" expressions', () => {
      const query = client
        .courses()
        .filter(['Campus', 'Code'], Op.EQ, 'LAM')
        .and(
          expression(['DeliveryMethod', 'Code'], Op.EQ, 'TL').or(
            ['DeliveryMethod', 'Code'],
            Op.EQ,
            'EXT',
          ),
        )
        .query();
      expect(query).toBe(
        "/Courses?$filter=Campus/Code eq 'LAM'" +
          " and (DeliveryMethod/Code eq 'TL'" +
          " or DeliveryMethod/Code eq 'EXT')",
      );
    });

    test('doesn\'t add "and" operator when the expression is empty', () => {
      const query = client
        .courses()
        .and(['Campus', 'Code'], Op.EQ, 'LAM')
        .and(['DeliveryMethod', 'Code'], Op.EQ, 'TL')
        .query();
      expect(query).toBe("/Courses?$filter=Campus/Code eq 'LAM' and DeliveryMethod/Code eq 'TL'");
    });

    test('doesn\'t add "or" operator when the expression is empty', () => {
      const query = client
        .courses()
        .or(['Campus', 'Code'], Op.EQ, 'LAM')
        .or(['DeliveryMethod', 'Code'], Op.EQ, 'TL')
        .query();
      expect(query).toBe("/Courses?$filter=Campus/Code eq 'LAM' or DeliveryMethod/Code eq 'TL'");
    });

    test('"not" expressions on fields', () => {
      const query = client.courses().filter(Op.NOT, ['Campus', 'IsActive']).query();
      expect(query).toBe('/Courses?$filter=not Campus/IsActive');
    });

    test('"not" expressions on other expressions', () => {
      const query = client.courses().filter(Op.NOT, expression('Age', Op.GT, 52)).query();
      expect(query).toBe('/Courses?$filter=not (Age gt 52)');
    });
  });

  describe('arithmetic', () => {
    test.each`
      field    | operator  | value  | expected
      ${'Age'} | ${Op.ADD} | ${10}  | ${'/Students?$filter=Age add 10'}
      ${'Age'} | ${Op.SUB} | ${10}  | ${'/Students?$filter=Age sub 10'}
      ${'Age'} | ${Op.MUL} | ${1.8} | ${'/Students?$filter=Age mul 1.8'}
      ${'Age'} | ${Op.DIV} | ${80}  | ${'/Students?$filter=Age div 80'}
      ${'Age'} | ${Op.MOD} | ${-18} | ${'/Students?$filter=Age mod -18'}
    `('"$operator" expressions', ({field, operator, value, expected}) => {
      const query = client.students().filter(field, operator, value).query();
      expect(query).toBe(expected);
    });

    test('arithmetic expressions in comparison operators', () => {
      const query = client.students().filter(expression('Age', Op.ADD, 2), Op.EQ, 18).query();
      expect(query).toBe('/Students?$filter=(Age add 2) eq 18');
    });
  });

  describe('functions', () => {
    test('function call expressions', () => {
      const query = client
        .students()
        .filter(fn('startswith', field('Code'), 'EXT'))
        .query();
      expect(query).toBe("/Students?$filter=startswith(Code,'EXT')");
    });

    test('function call in comparison expresion', () => {
      const query = client
        .students()
        .filter(fn('length', field('ClassSections')), Op.GT, 1)
        .query();
      expect(query).toBe('/Students?$filter=length(ClassSections) gt 1');
    });
  });

  describe('lambdas', () => {
    test('"any" expressions', () => {
      const query = client.students().any('ClassSections', 'Code', Op.EQ, 'EXT_TL').query();
      expect(query).toBe(
        "/Students?$filter=ClassSections/any(classSection: classSection/Code eq 'EXT_TL')",
      );
    });

    test('"all" expressions', () => {
      const query = client.students().all('ClassSections', 'Code', Op.EQ, 'EXT_TL').query();
      expect(query).toBe(
        "/Students?$filter=ClassSections/all(classSection: classSection/Code eq 'EXT_TL')",
      );
    });

    test('"any" expressions with functions', () => {
      const query = client
        .students()
        .any('ClassSections', fn('hasstudents', field('Course')))
        .query();
      expect(query).toBe(
        '/Students?$filter=ClassSections/any(classSection: hasstudents(classSection/Course))',
      );
    });

    test('"all" expressions with functions', () => {
      const query = client
        .students()
        .all('ClassSections', fn('hasstudents', field('Course')))
        .query();
      expect(query).toBe(
        '/Students?$filter=ClassSections/all(classSection: hasstudents(classSection/Course))',
      );
    });

    test('"any" expressions with field paths', () => {
      const query = client
        .students()
        .any(['DeliveryMethod', 'Courses'], 'Code', Op.EQ, 'EXT_TL')
        .query();
      expect(query).toBe(
        "/Students?$filter=DeliveryMethod/Courses/any(course: course/Code eq 'EXT_TL')",
      );
    });

    test('expressions with field paths on the operator', () => {
      const query = client
        .students()
        .any('DeliveryMethods', ['Course', 'Code'], Op.EQ, 'EXT')
        .query();
      expect(query).toBe(
        "/Students?$filter=DeliveryMethods/any(deliveryMethod: deliveryMethod/Course/Code eq 'EXT')",
      );
    });

    test('throws when an invalid collection value is provided', () => {
      const query = client.students();
      expect(() => query.all(2, 'Code', Op.EQ, 'TL')).toThrow('Invalid field 2');
    });
  });

  describe('builder syntax', () => {
    test('build filter using a callback', () => {
      const codes = ['FOO', 'BAR', 'BAZ'];
      const query = client
        .students()
        .filter((expression) => codes.reduce((e, code) => e.or('Code', Op.EQ, code), expression))
        .query();
      expect(query).toBe("/Students?$filter=(Code eq 'FOO' or Code eq 'BAR' or Code eq 'BAZ')");
    });

    test('build filter with "and" using a callback', () => {
      const query = client
        .students()
        .filter(['Campus', 'Code'], Op.EQ, 'LAM')
        .and((e) =>
          e
            .or(['DeliveryMethod', 'Code'], Op.EQ, 'TL')
            .or(['DeliveryMethod', 'Code'], Op.EQ, 'EXT'),
        )
        .query();
      expect(query).toBe(
        "/Students?$filter=Campus/Code eq 'LAM' and (DeliveryMethod/Code eq 'TL' or DeliveryMethod/Code eq 'EXT')",
      );
    });
  });
});
