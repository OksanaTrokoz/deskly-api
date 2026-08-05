# Deskly API

Hot-desk booking service for a hybrid office. A small Express API with six
endpoints, API-key authentication, and one core business rule: **a desk cannot
be booked twice for the same date.**

## Running it

```bash
npm install
npm start          # or: npm run dev  (restarts on file change)
```

Listens on **port 4000** by default. Override the port and API key with
environment variables:

```bash
PORT=5050 API_KEY=my-key npm start
```

Verify it's up:

```bash
curl http://localhost:4000/health
```

## Authentication

Every endpoint except `GET /health` requires an API key header:

```
X-API-Key: demo-key
```

The key defaults to `demo-key` and can be changed with the `API_KEY`
environment variable. A missing key returns `401 MISSING_API_KEY`; a wrong key
returns `403 INVALID_API_KEY`.

## Endpoints

| Method | Path | Success | Notes |
|---|---|---|---|
| GET | `/health` | 200 | Public. No API key needed. |
| GET | `/desks` | 200 | Optional `?zone=north\|south\|quiet` |
| GET | `/desks/:deskId` | 200 | 404 if unknown |
| GET | `/bookings` | 200 | Optional `?date=YYYY-MM-DD` and `?deskId=` |
| POST | `/bookings` | 201 | See error cases below |
| GET | `/bookings/:bookingId` | 200 | 404 if unknown |
| DELETE | `/bookings/:bookingId` | 200 | 404 if unknown |

### GET /desks

Returns all desks, optionally filtered by zone. Each desk includes its zone and
whether it has a monitor or is a standing desk.

```json
{
  "count": 1,
  "zone": "north",
  "desks": [
    { "id": "desk-1", "label": "North 01", "zone": "north", "monitor": true, "standing": false }
  ]
}
```

### GET /bookings

Returns all bookings, optionally filtered by `date` and/or `deskId`.

```json
{
  "count": 1,
  "bookings": [
    {
      "id": "bkg_seed01",
      "deskId": "desk-1",
      "date": "2026-08-06",
      "bookedBy": "priya@example.com",
      "createdAt": "2026-08-05T09:00:00.000Z"
    }
  ]
}
```

### POST /bookings

Reserves a desk for a date.

```json
{
  "deskId": "desk-3",
  "date": "2026-08-08",
  "bookedBy": "sam@example.com"
}
```

`deskId` and `date` are required. `bookedBy` is optional and defaults to
`"unassigned"`.

| Status | Error code | Cause |
|---|---|---|
| 201 | — | Booking created |
| 400 | `VALIDATION_ERROR` | Missing `deskId` or `date` |
| 400 | `VALIDATION_ERROR` | `date` not formatted `YYYY-MM-DD` |
| 400 | `VALIDATION_ERROR` | `date` is in the past |
| 400 | `MALFORMED_JSON` | Body isn't valid JSON |
| 404 | `DESK_NOT_FOUND` | No such desk |
| **409** | **`DESK_UNAVAILABLE`** | **Desk already booked for that date** |

The 409 response names the blocking booking:

```json
{
  "error": "DESK_UNAVAILABLE",
  "message": "Desk desk-1 is already booked on 2026-08-06.",
  "conflictingBookingId": "bkg_seed01"
}
```

### DELETE /bookings/:bookingId

Releases a desk by deleting the booking.

```json
{
  "released": true,
  "bookingId": "bkg_seed01"
}
```

Returns `404 BOOKING_NOT_FOUND` if the booking doesn't exist.

## Data and state

State is held in memory and resets on restart. The service seeds:

- Six desks (`desk-1` … `desk-6`) across three zones: `north`, `south`, and
  `quiet`.
- One booking: **`desk-1` is pre-booked for tomorrow**, so a 409 conflict can be
  reproduced from a cold start with no setup calls.

Seeded dates are computed relative to today, so they never go stale.

## Project layout

```
src/
├── server.js              # entrypoint, reads PORT
├── app.js                 # middleware and route wiring
├── store.js               # data + business rules (no framework imports)
├── middleware/
│   └── auth.js            # X-API-Key check
└── routes/
    ├── health.js
    ├── desks.js
    └── bookings.js
```

Business logic lives in `store.js` with no Express dependency, so the 409 rule
and the validation branches are testable in isolation.
