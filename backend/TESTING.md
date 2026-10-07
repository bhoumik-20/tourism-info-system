# Verified backend tests

Run on 7 October 2026 against the existing local TOURISM database:

- Node.js: 24.19.0 x64.
- Express: 5.2.1.
- node-oracledb: 6.10.0, Thick mode.
- Oracle client: XE bundled client 11.2.0.2.0 x64.
- Oracle database: XE 11.2.0.2.0; two populated cities.

`npm run check:db` successfully logged in as TOURISM and queried CITY.

`npm test`: **6 passed, 0 failed**. The tests make HTTP requests to the actual Express app and execute actual Oracle queries; no mocked database is used.

1. Health, cities, demo-user selector, all five catalogue lists/details, contacts/nearby/subtype arrays, search, city/type/rating/subtype filters, and ROWNUM pagination.
2. Review insert/update/delete, persisted changes, last-updated date, and rating aggregates compared with SQL.
3. Saved POI insert/list/delete, duplicate conflicts, and preservation of pre-existing saved associations.
4. Trip and itinerary create/list/detail/update/delete, same-user composite references, itinerary membership insert/delete, dependent-trip conflict, and atomic membership cleanup.
5. Invalid IDs, missing records, unknown/repeated filters, invalid dates/ratings/JSON, and missing foreign-key references.
6. Actual rollback after a deliberate failed multi-statement write, and concurrent trip creation with distinct per-user numbers.

Every implemented HTTP method/path combination was exercised. The final cleanup verifies all 25 table counts and hashes of existing rows in REVIEW, TRIP, ITINERARY, ITINERARY_POI, and USER_SAVES_POI match the pre-test snapshot. Temporary test rows are removed; sequence values advance normally.

No frontend was implemented or tested. These checks apply to this local populated schema and client installation, not to arbitrary Oracle installations. Rerun after changing database or backend configuration, with no other writers using the demo database.
