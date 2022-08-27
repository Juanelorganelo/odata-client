const {field} = require('../src');
const {createODataTestClient} = require('./support/mocks/odata');

describe('navigating resources', () => {
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
            {
              name: 'Courses',
              url: 'Courses',
            },
            {
              name: 'ClassSections',
              url: 'ClassSections',
            },
          ],
        },
      },
    });
  });

  describe('expand', () => {
    test('expands a single property', () => {
      const query = client.students().expand('Courses').query();
      expect(query).toBe('/Students?$expand=Courses');
    });

    test('expands multiple properties', () => {
      const query = client.students().expand('Courses', 'Assessments').query();
      expect(query).toBe('/Students?$expand=Courses,Assessments');
    });
  });

  describe('select', () => {
    test('selects a single property', () => {
      const query = client.students().select('FirstName').query();
      expect(query).toBe('/Students?$select=FirstName');
    });

    test('selects multiple properties', () => {
      const query = client.students().select('FirstName', 'LastName').query();
      expect(query).toBe('/Students?$select=FirstName,LastName');
    });
  });

  describe('nesting', () => {
    test('nested expand', () => {
      const query = client.courses().expand(field('DeliveryMethod').expand('CampusGroup')).query();
      expect(query).toBe('/Courses?$expand=DeliveryMethod($expand=CampusGroup)');
    });

    test('nested select', () => {
      const query = client.courses().expand(field('DeliveryMethod').select('LmsVendor')).query();
      expect(query).toBe('/Courses?$expand=DeliveryMethod($select=LmsVendor)');
    });

    test('nested expand with select', () => {
      const query = client
        .courses()
        .expand(field('DeliveryMethod').expand('CampusGroup').select('CampusGroup', 'Code'))
        .query();
      expect(query).toBe(
        '/Courses?$expand=DeliveryMethod($select=CampusGroup,Code;$expand=CampusGroup)',
      );
    });

    test('expands deeply nested fields', () => {
      const query = client
        .classSections()
        .expand(
          field('RegisteredStudents')
            .select('CreatedAt', 'MeetingDays')
            .expand(field('Student').select('FirstName', 'LastName', 'EmailAddress')),
        )
        .query();
      expect(query).toBe(
        '/ClassSections?$expand=RegisteredStudents($select=CreatedAt,MeetingDays;$expand=Student($select=FirstName,LastName,EmailAddress))',
      );
    });

    test('throws when expanding a field path', () => {
      const query = client.classSections();
      expect(() => query.expand(field(['Code', 'Name']).expand('Foo'))).toThrow(
        'Nested path on expanded identifier "Code/Name"',
      );
    });
  });
});
