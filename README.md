# Deskly API

Hot-desk booking service for a hybrid office. Six endpoints, one API key header,
one interesting business rule: **a desk cannot be booked twice for the same date.**

Built as the demo subject for a Git-native Postman session. Deliberately small,
deliberately conventional — route definitions are plain and explicit so that a
codebase scan finds all six endpoints without guesswork.

## Running it

```bash
npm install
npm start          # or: npm run dev  (restarts on file change)
```

Listens on **port 4000** by default. Port 3000 and 8080 are avoided on purpose —
they collide with too much else.

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

Missing key returns `401 MISSING_API_KEY`. Wrong key returns `403 INVALID_API_KEY`.

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

### POST /bookings

```json
{
  "deskId": "desk-3",
  "date": "2026-08-08",
  "bookedBy": "sam@example.com"
}
```

`deskId` and `date` are required. `bookedBy` is optional and defaults to `"unassigned"`.

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

## Seed data and state

State is in-memory and resets on restart, which is what you want between demo
runs — no reset endpoint to clean up, just `Ctrl-C` and `npm start`.

Six desks (`desk-1` … `desk-6`) across three zones. **`desk-1` is pre-booked for
tomorrow**, so a 409 conflict is reproducible from a cold start with no setup
calls. Every other desk is free.

Seeded dates are computed relative to today, so this repo doesn't go stale.

## Demo staging

Two branches:

- **`main`** — this code only. No Postman collection, no environment, no tests.
  That empty starting state is what makes the "watch the collection file appear
  on disk" moment work.
- **`demo-complete`** — everything finished and committed. Your rescue branch if
  a live agent run wanders off.

Don't commit a `.postman/` config by hand — connect the repo in the Postman
desktop app and use the *Generate config file* prompt so the format matches
whatever version you're running.

### Suggested demo path

1. Hand-build `GET /desks` — proves the server is up and teaches what a request is.
2. Agent Mode scans the codebase and generates the other five.
3. Extract `{{baseURL}}`, create the environment with `apiKey` as a secret.
4. Agent Mode writes tests, including the 409 conflict case.
5. Chain `POST /bookings` → `{{bookingId}}` → `GET` → `DELETE`.
6. Commit, push, raise the PR, review the YAML diff.

### Optional: code + contract in one PR

For a stronger diff, change the past-date message in `src/store.js`:

```js
if (payload.date < isoDate(0)) {
  return {
    status: 400,
    error: 'VALIDATION_ERROR',
    message: 'date must not be in the past.',   // <- edit this line
```

Now one pull request contains a behaviour change, the updated contract, and the
test that covers it. That's the most persuasive version of the argument.

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
