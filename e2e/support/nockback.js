const path = require('path');
const {back: nockback} = require('nock');

nockback.fixtures = path.resolve(__dirname, '..', 'fixtures');

nockback.record = function record(fixture, callback) {
  return new Promise((resolve) => {
    nockback(fixture, async (done) => {
      await callback();
      done();
      resolve();
    });
  });
};

module.exports = nockback;
