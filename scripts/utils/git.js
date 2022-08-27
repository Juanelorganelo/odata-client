const proc = require('./proc');

/**
 * Bump project version and commit changes.
 * @param {string} version Version bump.
 */
exports.bump = async (version) => {
  await proc.exec('npm', ['version', version]);
};

/**
 * Push current branch changes.
 */
exports.pushMaster = async () => {
  await proc.exec('git', ['push', 'origin', '-u', 'master']);
  await proc.exec('git', ['push', 'origin', '--tags']);
};

/**
 * Check if the current git repo is clean.
 * @return {Promise<boolean>} True if the repository is clean.
 */
exports.isClean = async () => {
  let status;
  try {
    status = await proc.exec('git', ['status', '--porcelain']);
  } catch (err) {
    status = true;
  }

  return !status;
};

/**
 * Check if the current branch is the master branch.
 * @return {Promise<boolean>} True if the current branch is master.
 */
exports.isMaster = async () => {
  const branch = await proc.exec('git', ['branch', '--show-current']);
  return branch === 'master';
};
