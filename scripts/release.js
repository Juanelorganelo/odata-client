const path = require('path');
const {promises: fs} = require('fs');
const git = require('./utils/git');
const Logger = require('./utils/logger');

async function main() {
  const logger = new Logger('release');

  if (!(await git.isClean())) {
    logger.error(
      'You have uncommited changes on your repo. Commit them or stash them before releasing',
    );
    process.exit(1);
  }

  if (!(await git.isMaster())) {
    logger.error('Releases can only be made from the master branch');
    process.exit(1);
  }

  const version = process.argv[2];

  if (!version) {
    logger.error('A version bump argument is required');
    process.exit(1);
  }

  logger.info(`Bumping version ${await getCurrentVersion()}`);
  await git.bump(version);
  logger.info(`Releasing new version ${await getCurrentVersion()}`);
  await git.pushMaster();
}
main();

async function getCurrentVersion() {
  const pkg = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'package.json')));
  return pkg.version;
}
