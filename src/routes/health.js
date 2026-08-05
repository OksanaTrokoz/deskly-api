'use strict';

const express = require('express');

const router = express.Router();

const startedAt = Date.now();

// GET /health - liveness probe. No authentication required.
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'deskly',
    version: '1.0.0',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  });
});

module.exports = router;
