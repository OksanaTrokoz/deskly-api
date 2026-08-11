'use strict';

// Dependency-free, colorised console logger.
// Colours are disabled automatically when stdout is not a TTY (e.g. piped to a
// file or CI) or when NO_COLOR is set, so log files stay clean and readable.

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

const codes = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function paint(text, ...styles) {
  if (!useColor) {
    return text;
  }

  const prefix = styles.map((style) => codes[style] || '').join('');
  return `${prefix}${text}${codes.reset}`;
}

const levels = {
  info: { label: 'INFO', color: 'cyan', stream: 'stdout' },
  success: { label: 'OK', color: 'green', stream: 'stdout' },
  warn: { label: 'WARN', color: 'yellow', stream: 'stderr' },
  error: { label: 'ERROR', color: 'red', stream: 'stderr' },
  debug: { label: 'DEBUG', color: 'magenta', stream: 'stdout' },
};

function timestamp() {
  return new Date().toISOString();
}

function write(levelName, args) {
  const level = levels[levelName];
  const time = paint(timestamp(), 'gray');
  const tag = paint(` ${level.label} `, 'bold', level.color);
  const prefix = `${time} ${tag}`;

  if (level.stream === 'stderr') {
    console.error(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

const logger = {
  paint,
  info: (...args) => write('info', args),
  success: (...args) => write('success', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  debug: (...args) => write('debug', args),
};

module.exports = logger;
