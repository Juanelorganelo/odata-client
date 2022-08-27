const {createODataClient} = require('../src');
const nockback = require('./support/nockback');

describe('pagination', () => {
  let client;
  beforeEach(async () => {
    nockback.setMode('record');
    await nockback.record('root.json', async () => {
      client = await createODataClient({
        baseURL: 'https://services.odata.org/TripPinRESTierService/(S(ayl54pmyj0rh5l151nhbbrqj))/',
      });
    });
  });

  afterEach(() => {
    nockback.setMode('wild');
  });

  test('total pages', async () => {
    await nockback.record('airports-total.json', async () => {
      let pages = 0;
      for await (const page of client.airports()) {
        pages += 1;
        expect(page.length).toBe(5);
      }

      expect(pages).toBe(1);
    });
  });

  test('custom top', async () => {
    await nockback.record('airports-custom-top.json', async () => {
      let pages = 0;
      for await (const page of client.airports().top(1)) {
        pages += 1;
        expect(page.length).toBe(1);
      }

      expect(pages).toBe(5);
    });
  });
});
