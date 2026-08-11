'use strict';

const logger = require('../logger');

// Colour HTTP methods so they are easy to scan in the terminal.
const methodColors = {
  GET: 'green',
  POST: 'blue',
  PUT: 'yellow',
  PATCH: 'yellow',
  DELETE: 'red',
};

function statusColor(status) {
  if (status >= 500) {
    return 'red';
  }
  if (status >= 400) {
    return 'yellow';
  }
  if (status >= 300) {
    return 'cyan';
  }
  return 'green';
}

/**
 * Logs one line per request once the response finishes, including the method,
 * path, status code and how long the handler took to respond.
 */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    const method = logger.paint(
      req.method.padEnd(6),
      'bold',
      methodColors[req.method] || 'gray'
    );
    const status = logger.paint(res.statusCode, 'bold', statusColor(res.statusCode));
    const duration = logger.paint(`${durationMs.toFixed(1)}ms`, 'gray');

    logger.info(`${method} ${req.originalUrl} ${status} ${duration}`);
  });

  next();
}

module.exports = requestLogger;
