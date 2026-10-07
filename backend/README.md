# Tourism backend

Simple BACSE202 REST API: Node.js, Express 5, node-oracledb 6.10, and readable bound Oracle SQL. No ORM or authentication. Intended for a local classroom demo; listens on `127.0.0.1`.

## Setup and run

Use Windows x64 Node.js 22 or later (tested with Node 24.19.0). Oracle XE and its listener must be running, with the existing populated TOURISM schema.

From `backend/`:

```powershell
npm install
Copy-Item .env.example .env  # only if .env does not already exist
# Edit .env locally and enter the TOURISM password; never commit it.
npm run check:db
npm run setup:db
npm start
```

API base: `http://localhost:5000/api`. `npm run dev` restarts the server after file changes. Ctrl+C releases the connection pool. The server tests the database before listening.

## Environment

| Variable | Purpose / default |
| --- | --- |
| PORT | HTTP port, 5000 |
| DB_USER | Existing schema, TOURISM |
| DB_PASSWORD | Required local password; blank in .env.example |
| DB_CONNECT_STRING | localhost:1521/XE |
| ORACLE_CLIENT_LIB_DIR | Directory containing compatible 64-bit OCI libraries |
| ORACLE_HOME | Full XE installation home when using its bundled client |
| FRONTEND_ORIGIN | Optional CORS origin; defaults to http://localhost:5173 |

`.env` is loaded by Node's built-in environment-file support. Quote passwords containing `#` or spaces. A process environment variable takes precedence over `.env`. Never put credentials in a URL, source code, or Git.

## Oracle connectivity

Verified on this machine: Node x64 24.19.0, driver 6.10.0 in **Thick mode**, XE client 11.2.0.2.0, server 11.2.0.2.0, and TOURISM with two populated cities.

The default Thin mode requires Database 12.1+, so it cannot connect to XE 11g. Installed Instant Client 23 also cannot connect to 11g. Driver 7 dropped support for the bundled 11g client, so this project pins driver 6.10.0 and calls `initOracleClient()` explicitly with:

```text
ORACLE_CLIENT_LIB_DIR=C:\oraclexe\app\oracle\product\11.2.0\server\bin
ORACLE_HOME=C:\oraclexe\app\oracle\product\11.2.0\server
```

See [Oracle's driver 6.10 installation and compatibility guide](https://node-oracledb.readthedocs.io/en/v6.10.0/user_guide/installation.html). Client and Node architectures must match. A missing or incompatible client typically produces DPI-1047; ORA-01017 means the database rejected the login. Do not automatically upgrade the driver to version 7 while using the XE client.

`setup:db` creates only `REVIEW_ID_SEQ` above existing review IDs, and leaves an existing sequence unchanged. Run once before review inserts and before starting multiple server instances. DDL commits implicitly, so setup runs separately from request transactions. Sequence gaps after rollbacks or tests are normal. Existing tables, demonstration data, views, and triggers are preserved.

## API

Responses use camelCase keys. Lists return `{ data, page, limit }`; details and writes return `{ data }`. Cities and demo users return `{ data }` without pagination. Errors return `{ error }`. List defaults: page 1, limit 20; maximum limit 100. Empty collections return 200 with an empty array; missing individual records return 404.

| Method | Path below /api | Behavior |
| --- | --- | --- |
| GET | /health | Live database check |
| GET | /cities, /cities/:id | Cities and a city |
| GET | /users | Demo user IDs and names for selection |
| GET | /pois, /pois/:id | POI search/list and full details |
| GET | /places, /places/:id | Places with categories in detail |
| GET | /restaurants, /restaurants/:id | Restaurants with cuisines, dishes, dining types, ambience, parking, accessibility, payments |
| GET | /activities, /activities/:id | Activities with seasons, equipment, locations |
| GET | /events, /events/:id | Events, dates, ticket/registration details |
| GET, POST | /pois/:id/reviews | List or create reviews |
| PUT, DELETE | /reviews/:id | Replace editable review fields or delete |
| GET | /users/:userId/saved-pois | List saved POIs |
| POST, DELETE | /users/:userId/saved-pois/:poiId | Save or remove a POI |
| GET, POST | /users/:userId/trips | List or create trips |
| GET, PUT, DELETE | /users/:userId/trips/:tripNo | Read, replace editable fields, delete |
| GET, POST | /users/:userId/itineraries | List or create itineraries |
| GET, PUT, DELETE | /users/:userId/itineraries/:itineraryNo | Read with POIs, replace editable fields, delete |
| POST, DELETE | /users/:userId/itineraries/:itineraryNo/pois/:poiId | Add/remove membership |

All POI detail responses include contacts, nearby POIs, derived averageRating, and reviewCount. General POI details also include applicable subtype objects. Null averageRating means there are no reviews. Multivalued collections appear in detail responses rather than separate CRUD endpoints. The existing itinerary-membership table has no ordering column; POIs are displayed by name, without inventing visit order.

## Filters

All five catalogue lists accept `city` (numeric ID), `search` (case-insensitive literal substring in name or description), `minRating` (1-5), `page`, and `limit`.

- POIs: `type=places|restaurants|activities|events`.
- Places: `category`.
- Restaurants: `cuisine`, `priceRange`, `delivery=Y|N`, `parking=Y|N`.
- Activities: `activityType`, `difficulty`, `season`, `maxCost`.
- Events: `eventType`, `from=YYYY-MM-DD`, `to=YYYY-MM-DD` (overlaps the inclusive requested date range).
- Itinerary lists: optional `tripNo`.

Text filters other than search match the entire value, case-insensitively. Unknown parameters and repeated parameters return 400. Pagination uses ordered ROWNUM queries compatible with 11g.

Examples:

```text
/api/pois?city=1&search=palace
/api/restaurants?cuisine=South%20Indian&priceRange=Budget
/api/activities?maxCost=500
/api/events?from=2026-10-01&to=2026-12-31
```

## Write bodies and transactions

Send `Content-Type: application/json`. Use IDs returned by GET requests; there is no login or user-management flow.

Review POST: `{ "userId": 1, "rating": 4.5, "comments": "Worth visiting" }`.
Review PUT: `{ "rating": 4, "comments": "Updated review" }`. Rating is required, between 1 and 5, with at most one decimal place. User/POI ownership is fixed after creation.

Trip POST/PUT: `{ "tripName": "Mumbai weekend", "startDate": "2026-11-01", "endDate": "2026-11-03", "description": "Optional", "status": "Planned" }`.

Itinerary POST/PUT: `{ "itineraryName": "Day one", "tripNo": 1, "startDate": "2026-11-01", "endDate": "2026-11-01", "description": "Optional" }`.

Names are required; itinerary tripNo must belong to the same user. Dates must be real YYYY-MM-DD values; endDate cannot precede startDate. PUT replaces the editable fields: omitted optional fields become null. Saved-POI and itinerary-membership POSTs need no body.

Every write acquires a pooled connection, commits after success, rolls back on error, and closes the connection. Bind variables carry request values. Fixed table/column constants are the only interpolated SQL identifiers. Review IDs use the sequence. Trip and itinerary numbers use MAX+1 under an APP_USER row lock in the same transaction, preserving the weak-entity composite keys. This locking rule assumes plan writes go through this backend.

Creates return 201; updates return 200; deletes return 204. Invalid input returns 400; missing records return 404; duplicates and dependent-record deletions return 409. A trip with itineraries cannot be deleted. Deleting an itinerary removes its memberships atomically. Internal Oracle messages and credentials are not returned or logged.

## Test

```powershell
npm run check:db
npm test
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod 'http://localhost:5000/api/pois?search=palace'
```

`npm test` connects to the real populated TOURISM database and serves the actual Express app on a temporary local port. It exercises catalogue lists/details/filters, all write lifecycles, duplicate and FK conflicts, validation, rollback, and concurrent trip creation. Tests discover existing IDs, create temporary records, remove only their own records, then verify all table counts and hashes of mutable tables match their initial state. Review sequence values advance even though test rows are removed. Run while nobody else is editing the demo database.

Verified test results are recorded in [TESTING.md](TESTING.md). The frontend remains reserved for later work.
