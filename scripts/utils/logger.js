const chalk = require('chalk');

/**
 * Log levels.
 * @enum {number}
 */
const Levels = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Level color mapping.
 */
const Colors = {
  [Levels.INFO]: 'cyan',
  [Levels.WARN]: 'yellow',
  [Levels.ERROR]: 'red',
};

/**
 * A logger for sll the scripts.
 */
module.exports = class Logger {
  /**
   * Logger name
   * @param {string} name The name of the logger.
   */
  constructor(name) {
    this.name = name;

    /**
     * Log a message with info level.
     * @param {string} message Log message.
     * @param {...any} args Additional console arguments.
     */
    this.info = this.log.bind(this, Levels.INFO);
    /**
     * Log a message with warn level.
     * @param {string} message Log message.
     * @param {...any} args Additional console arguments.
     */
    this.warn = this.log.bind(this, Levels.WARN);
    /**
     * Log a message with error level.
     * @param {string} message Log message.
     * @param {...any} args Additional console arguments.
     */
    this.error = this.log.bind(this, Levels.ERROR);
  }

  /**
   * Log a message.
   * @param {Levels} level Log level.
   * @param {string} message Log message.
   * @param  {...any} args Additional console arguments.
   * @private
   */
  log(level, message, ...args) {
    const record = {
      name: this.name,
      level,
      message,
    };

    const log = console[level] || console.log;
    log.call(console, format(record), ...args);
  }
};

/**
 * Format a log record.
 * @param {object} record Log record.
 * @return {string} Formatted message.
 */
function format(record) {
  const {level} = record;
  let {name, message} = record;

  if (level in Colors) {
    message = colorize(message, Colors[level]);
  }

  name = colorize(`[${name}]`, 'bold');

  return `${name}: ${message}`;
}

/**
 * Add an ANSI color to a string.
 * @param {string} string String to colorize.
 * @param {string} color Color name.
 * @return {string} Colorized string.
 */
function colorize(string, color) {
  return chalk[color].call(chalk, string);
}
