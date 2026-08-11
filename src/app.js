'use strict';

const express = require('express');
const logger = require('./logger');
const requestLogger = require('./middleware/request-logger');
const { requireApiKey } = require('./middleware/auth');
const healthRoutes = require('./routes/health');
const deskRoutes = require('./routes/desks');
const bookingRoutes = require('./routes/bookings');

const app = express();

// Log every request (including health checks and rejected auth) up front.
app.use(requestLogger);

app.use(express.json());

// Public.
app.use(healthRoutes);

// Everything below requires a valid X-API-Key header.
app.use(requireApiKey);
app.use(deskRoutes);
app.use(bookingRoutes);

// Unmatched routes.
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `${req.method} ${req.path} is not a route on this service.`,
  });
});

// Malformed JSON bodies arrive here as SyntaxError from express.json().
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'MALFORMED_JSON',
      message: 'The request body could not be parsed as JSON.',
    });
  }

  logger.error(err);
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong handling that request.',
  });
});

module.exports = app;
