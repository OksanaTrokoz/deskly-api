'use strict';

const API_KEY = process.env.API_KEY || 'demo-key';

/**
 * Requires a valid X-API-Key header.
 * GET /health is mounted before this middleware and stays public.
 */
function requireApiKey(req, res, next) {
  const supplied = req.get('X-API-Key');

  if (!supplied) {
    return res.status(401).json({
      error: 'MISSING_API_KEY',
      message: 'Provide your key in the X-API-Key header.',
    });
  }

  if (supplied !== API_KEY) {
    return res.status(403).json({
      error: 'INVALID_API_KEY',
      message: 'The supplied X-API-Key is not valid.',
    });
  }

  return next();
}

module.exports = { requireApiKey, API_KEY };
