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
npm run check:schema  # SELECT-only checks of manually installed objects
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

`check:schema` only reads Oracle metadata. The existing `REVIEW_ID_SEQ` and manually installed `APP_USER_ID_SEQ`, six curated views and four triggers must already exist and be valid. Missing objects are reported for manual installation by the database owner; the backend never runs DDL. The legacy setup script is disabled. Sequence gaps after failed inserts or tests are normal.

## API

Responses use camelCase keys. Lists return `{ data, page, limit }`; details and writes return `{ data }`. Cities, profiles and collection metadata return `{ data }` without pagination. Errors return `{ error }`; recognized Oracle failures also include `{ code }`. List defaults: page 1, limit 20; maximum limit 100. Empty collections return 200 with an empty array; missing individual records return 404.

| Method | Path below /api | Behavior |
| --- | --- | --- |
| GET | /health | Live database check |
| GET | /cities, /cities/:id | Cities and a city |
| GET, POST | /users | List real profiles or create a user with APP_USER_ID_SEQ |
| GET, PUT | /users/:userId | Profile attributes/statistics or replace editable attributes |
| GET | /collections | Six installed view collections with live counts |
| GET | /collections/:slug | Read-only curated results, city/type filters and pagination |
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
| GET | /users/:userId/trips/:tripNo/summary | Live deduplicated trip dashboard |
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
- Collections: `city`, `type=PLACE|RESTAURANT|ACTIVITY|EVENT|UNCLASSIFIED`, `page`, `limit`. Slugs: `top-rated`, `popular`, `budget`, `foodie`, `upcoming`, `hidden-gems`. Each maps to one fixed installed view; view names never come from request SQL.

Text filters other than search match the entire value, case-insensitively. Unknown parameters and repeated parameters return 400. Pagination uses ordered ROWNUM queries compatible with 11g.

Examples:

```text
/api/pois?city=1&search=palace
/api/restaurants?cuisine=South%20Indian&priceRange=Budget
/api/activities?maxCost=500
/api/events?from=2026-10-01&to=2026-12-31
```

## Write bodies and transactions

Send `Content-Type: application/json`. Use IDs returned by GET requests and the active frontend profile. This is classroom ownership scoping, not authenticated identity verification.

Profile POST/PUT: `{ "firstName": "Aarav", "middleName": null, "lastName": "Sharma", "email": "aarav@example.com", "phoneNumber": null, "dateOfBirth": "2000-01-02", "profileImage": null }`. Only firstName and email are required by the installed constraints. Email is unique. Optional image must be an http/https URL without embedded credentials. Profile detail includes reviewCount, savedPoiCount, tripCount and itineraryCount derived from existing tables.

Review POST: `{ "userId": 1, "rating": 4.5, "comments": "Worth visiting" }`.
Review PUT: `{ "userId": 1, "rating": 4, "comments": "Updated review" }`. Review DELETE requires `?userId=1`; another profile cannot edit/delete that review. Rating is required, between 1 and 5, with at most one decimal place. User/POI ownership is fixed after creation.

Trip POST/PUT: `{ "tripName": "Mumbai weekend", "startDate": "2026-11-01", "endDate": "2026-11-03", "description": "Optional", "status": "Planned" }`.

Itinerary POST/PUT: `{ "itineraryName": "Day one", "tripNo": 1, "startDate": "2026-11-01", "endDate": "2026-11-01", "description": "Optional" }`.

Names are required; itinerary tripNo must belong to the same user. Itinerary and parent trip dates are required by the installed itinerary trigger and the itinerary must fit within its parent dates. Dates must be real YYYY-MM-DD values; endDate cannot precede startDate. PUT replaces the editable fields: omitted optional fields become null. Saved-POI and itinerary-membership POSTs need no body.

Every write acquires a pooled connection, commits after success, rolls back on error, and closes the connection. Bind variables carry request values. Fixed table/column constants are the only interpolated SQL identifiers. User and review IDs use their existing sequences. Review timestamps are supplied by TRG_REVIEW_TIMESTAMPS, not by the application. Trip and itinerary numbers use MAX+1 under an APP_USER row lock in the same transaction, preserving the weak-entity composite keys. This locking rule assumes plan writes go through this backend.

Creates return 201; updates return 200; deletes return 204. Invalid input returns 400; missing records return 404; duplicates and dependent-record deletions return 409. A trip with itineraries cannot be deleted. Deleting an itinerary removes its memberships atomically. Internal Oracle messages and credentials are not returned or logged.

## Installed triggers and dashboard

The backend preserves the four installed triggers. It maps their actual error codes to readable messages and HTTP 400/404/409 responses; the frontend displays failures and keeps the form open. See [the exact mapping and dashboard explanation](../PHASE2.md). Completing a trip makes later edits/deletion of the trip, its itineraries and memberships impossible through normal DML; the UI warns before completion.

The summary query uses CTEs, JOIN/LEFT JOIN, GROUP BY, COUNT, COUNT(DISTINCT), and AVG. It reports itinerary count, total memberships, unique POIs and deduplicated subtype counts. Average rating is the equally weighted mean of the average ratings of reviewed unique POIs; unrated POIs are excluded. Empty trips have zero counts and a null average.

## Test

```powershell
npm run check:db
npm run check:schema
npm run test:read
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod 'http://localhost:5000/api/collections/top-rated?city=1'
```

Read-only checks do not change records. Live write suites require prior human approval of [TEST_PLAN_PHASE2.md](../TEST_PLAN_PHASE2.md), then:

```powershell
$env:VOYAGE_LIVE_TESTS_APPROVED='1'
npm test
Remove-Item Env:VOYAGE_LIVE_TESTS_APPROVED
```

The flag prevents accidental writes; it does not replace permission. Run with no other writers. Tests serve the real Express app on temporary local ports, clean up recorded fixture IDs and verify the original database contents. Completed-trip trigger checks stay in a single uncommitted transaction and roll back. No DDL or administrative commands are run. Verified results and remaining limits are recorded in [TESTING.md](TESTING.md).
