/* eslint-disable no-negated-condition */
const {spawn} = require('child_process');

/**
 * Execute a shell command.
 * @param {string} command Command name.
 * @param {string[]} argv Command arguments.
 * @param {object} options Options for the spawn.
 * @return {Promise<string>} The command's output.
 */
exports.exec = (command, argv, options) => {
  const child = spawn(command, argv, options);

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    child.on('exit', (exitCode) => {
      if (exitCode !== 0) {
        reject(exitCode, stderr);
      } else {
        resolve(stdout);
      }
    });

    child.stdout.on('data', (data) => {
      stdout += data.toString('utf-8').trim();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString('utf-8').trim();
    });
  });
};
