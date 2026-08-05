'use strict';

const express = require('express');
const store = require('../store');

const router = express.Router();

// GET /desks - list all desks, optionally filtered by zone.
router.get('/desks', (req, res) => {
  const { zone } = req.query;
  const results = store.listDesks(zone);

  res.status(200).json({
    count: results.length,
    zone: zone || 'all',
    desks: results,
  });
});

// GET /desks/:deskId - fetch a single desk.
router.get('/desks/:deskId', (req, res) => {
  const desk = store.findDesk(req.params.deskId);

  if (!desk) {
    return res.status(404).json({
      error: 'DESK_NOT_FOUND',
      message: `No desk exists with id ${req.params.deskId}.`,
    });
  }

  return res.status(200).json(desk);
});

module.exports = router;
