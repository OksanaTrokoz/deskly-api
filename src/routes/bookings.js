'use strict';

const express = require('express');
const store = require('../store');

const router = express.Router();

// GET /bookings - list bookings, optionally filtered by date or deskId.
router.get('/bookings', (req, res) => {
  const { date, deskId } = req.query;
  const results = store.listBookings({ date, deskId });

  res.status(200).json({
    count: results.length,
    bookings: results,
  });
});

// POST /bookings - reserve a desk for a date.
// Returns 409 when that desk is already taken on that date.
router.post('/bookings', (req, res) => {
  const problem = store.validateBooking(req.body);

  if (problem) {
    const { status, ...body } = problem;
    return res.status(status).json(body);
  }

  const booking = store.createBooking(req.body);
  return res.status(201).json(booking);
});

// GET /bookings/:bookingId - fetch a single booking.
router.get('/bookings/:bookingId', (req, res) => {
  const booking = store.findBooking(req.params.bookingId);

  if (!booking) {
    return res.status(404).json({
      error: 'BOOKING_NOT_FOUND',
      message: `No booking exists with id ${req.params.bookingId}.`,
    });
  }

  return res.status(200).json(booking);
});

// DELETE /bookings/:bookingId - release the desk.
router.delete('/bookings/:bookingId', (req, res) => {
  const removed = store.deleteBooking(req.params.bookingId);

  if (!removed) {
    return res.status(404).json({
      error: 'BOOKING_NOT_FOUND',
      message: `No booking exists with id ${req.params.bookingId}.`,
    });
  }

  return res.status(200).json({
    released: true,
    bookingId: req.params.bookingId,
  });
});

module.exports = router;
