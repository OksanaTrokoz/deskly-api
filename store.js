'use strict';

/**
 * In-memory data store for the Deskly service.
 *
 * State lives in module scope and resets on restart, which is deliberate:
 * restarting the server gives you a clean slate between demo runs.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Returns an ISO date string (YYYY-MM-DD) offset from today by `days`. */
function isoDate(days = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const desks = [
  { id: 'desk-1', label: 'North 01', zone: 'north', monitor: true, standing: false },
  { id: 'desk-2', label: 'North 02', zone: 'north', monitor: true, standing: true },
  { id: 'desk-3', label: 'South 01', zone: 'south', monitor: false, standing: false },
  { id: 'desk-4', label: 'South 02', zone: 'south', monitor: true, standing: false },
  { id: 'desk-5', label: 'Quiet 01', zone: 'quiet', monitor: true, standing: true },
  { id: 'desk-6', label: 'Quiet 02', zone: 'quiet', monitor: false, standing: false },
];

let bookings = [];

function newBookingId() {
  return 'bkg_' + Math.random().toString(16).slice(2, 8).padEnd(6, '0');
}

/**
 * Seeds one existing booking so that a 409 conflict is reproducible from a
 * cold start without any setup calls. desk-1 is taken tomorrow.
 */
function seed() {
  bookings = [
    {
      id: 'bkg_seed01',
      deskId: 'desk-1',
      date: isoDate(1),
      bookedBy: 'priya@example.com',
      createdAt: new Date().toISOString(),
    },
  ];
}

seed();

function listDesks(zone) {
  if (!zone) return desks;
  const wanted = String(zone).toLowerCase();
  return desks.filter((d) => d.zone === wanted);
}

function findDesk(id) {
  return desks.find((d) => d.id === id);
}

function listBookings({ date, deskId } = {}) {
  return bookings.filter(
    (b) => (!date || b.date === date) && (!deskId || b.deskId === deskId)
  );
}

function findBooking(id) {
  return bookings.find((b) => b.id === id);
}

function findConflict(deskId, date) {
  return bookings.find((b) => b.deskId === deskId && b.date === date);
}

/**
 * Validates a booking payload.
 * Returns null when valid, otherwise a problem object the route layer
 * translates into an HTTP response.
 */
function validateBooking(body) {
  const payload = body && typeof body === 'object' ? body : {};
  const missing = ['deskId', 'date'].filter((field) => !payload[field]);

  if (missing.length > 0) {
    return {
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'Both deskId and date are required to create a booking.',
      details: missing.map((field) => ({ field, issue: 'required' })),
    };
  }

  if (!DATE_PATTERN.test(payload.date)) {
    return {
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'date must be formatted as YYYY-MM-DD.',
      details: [{ field: 'date', issue: 'format' }],
    };
  }

  // Tweak this message to demo a code change and a contract change
  // landing in the same pull request.
  if (payload.date < isoDate(0)) {
    return {
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'date must not be in the past.',
      details: [{ field: 'date', issue: 'past' }],
    };
  }

  if (!findDesk(payload.deskId)) {
    return {
      status: 404,
      error: 'DESK_NOT_FOUND',
      message: `No desk exists with id ${payload.deskId}.`,
    };
  }

  const conflict = findConflict(payload.deskId, payload.date);
  if (conflict) {
    return {
      status: 409,
      error: 'DESK_UNAVAILABLE',
      message: `Desk ${payload.deskId} is already booked on ${payload.date}.`,
      conflictingBookingId: conflict.id,
    };
  }

  return null;
}

function createBooking(body) {
  const booking = {
    id: newBookingId(),
    deskId: body.deskId,
    date: body.date,
    bookedBy: body.bookedBy || 'unassigned',
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  return booking;
}

function deleteBooking(id) {
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return false;
  bookings.splice(index, 1);
  return true;
}

module.exports = {
  isoDate,
  seed,
  listDesks,
  findDesk,
  listBookings,
  findBooking,
  findConflict,
  validateBooking,
  createBooking,
  deleteBooking,
};
