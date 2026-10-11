# Backend and Phase 2 verification

Completed 12 October 2026 against the existing populated TOURISM database, after the user explicitly approved TEST_PLAN_PHASE2.md. Node 24.19.0 x64, Express 5.2.1, node-oracledb 6.10.0 Thick mode, bundled XE client/server 11.2.0.2.0.

## Automated checks

- Backend `npm test`: **15 passed, 0 failed** using the real Express app and Oracle. Six existing CRUD/search/validation/concurrency/rollback tests, six Phase 2 write tests, and three read-only profile/view/summary tests.
- Frontend `npm test`: **14 passed, 0 failed** using offline domain, selection persistence, ownership, collection normalization and deduplicated summary data.
- Frontend `npm run build`: successful production build after the browser-discovered date input fix.
- `npm run check:schema`: all six views, four enabled triggers and both existing sequences valid after cleanup. SELECT only.

## Live backend coverage

1. Existing health/city/catalogue/detail/search, subtype and multivalued data, rating/date/type/city filters and ordered pagination.
2. Existing review/save/trip/itinerary/membership insert/update/delete flows, duplicate/dependency conflicts, invalid input, failed-write rollback and concurrent scoped trip allocation.
3. Two new temporary profiles persisted in APP_USER, retained their attributes, supported updates and rejected a duplicate email. User IDs came from APP_USER_ID_SEQ.
4. Reviews, saves, trips and itineraries used their selected owner. Cross-profile review updates/deletes returned 404. Separate profiles could each own trip number 1 without sharing records.
5. All six installed views returned real rows. Each collection supplied its original POI_ID to a real itinerary insert; duplicate memberships returned ORA-00001/409.
6. Genuine Oracle codes ORA-20013, 20014, 20015, 20023 and 20033 were checked through Express with their HTTP status and code. Failed edits left the original dates unchanged.
7. Genuine ORA-20011, 20012, 20021, 20022, 20031 and 20032 were checked directly on one Oracle connection. The completed-trip fixture was never committed and was rolled back. Completed-trip update/delete, itinerary update/delete and membership insert/delete guards rejected the operations. These cases were not submitted through HTTP while holding the uncommitted fixture.
8. TRG_REVIEW_TIMESTAMPS supplied both timestamps and preserved Review_Date when a review changed. The application did not set these timestamps.
9. Every existing dashboard matched independent Oracle membership/subtype/rating records. Temporary data verified four unique subtype POIs across five memberships, equal weighting of reviewed unique POIs, and zero/null counts for an empty trip.

## Approved live browser checks

- Created VoyageBrowserTestA and B through the actual form. Creation automatically selected the new profile. Edited birth dates, a phone number, middle name and a local image URL persisted; the avatar loaded in both navbar and profile panel. Reload retained selection and profile attributes.
- A's new Planned trip and dated itineraries persisted. A's save and review persisted; editing the review changed its rating to 4.2. B had zero saves/plans/reviews, could not see A's trip/itinerary by the same route number, and had no edit/delete controls for A's public review. Returning to A restored its own records.
- Added six distinct existing POIs using the actual picker on all six collection pages: Lalbagh Botanical Garden (Top Rated), Mavalli Tiffin Rooms (Popular), Cubbon Park (Budget), Vidyarthi Bhavan (Foodie), Bengaluru Food Festival (Upcoming), Marine Drive (Hidden Gems).
- The picker displayed only A's real trip and itineraries. An existing membership appeared disabled as “already added”. A profile with no plans received a link to create them.
- Genuine ORA-20015 itinerary-date, ORA-20023 parent-trip-date and ORA-20033 incompatible-event rejections displayed readable errors, kept the form open and preserved stored data.
- Added Lalbagh to a second itinerary. The dashboard refreshed to 2 itineraries, 6 unique POIs, 7 memberships, 3 Places, 2 Restaurants, 0 Activities, 1 Event and a mean POI rating of 4.82 across five reviewed unique POIs. Independent SELECTs matched the displayed values.
- Fresh captured browser logs contained no errors or warnings. Earlier read-only checks covered city filtering, all six collections and guest profile prompting.

Browser testing found two rendering/input issues: index-to-collection navigation read a null result before loading, and the profile date input did not capture the browser's input event. Both were fixed and the actual browser paths were rechecked; the updated frontend build and all 14 tests passed.

## Cleanup and limits

Temporary fixture IDs were recorded. Automated suites cleaned their own records; the two browser profiles and their dependent memberships, itineraries, trips, review and save were removed by recorded IDs. **Counts and SHA-256 hashes for all 25 base tables matched the baseline taken before any tests in this run.** No original records remain changed. The original selected profile (Meera) was restored before browser cleanup.

No DDL, GRANT, seed, migration or SQL installation was executed. No trigger was disabled or bypassed. Sequence consumption is permanent and expected. The local SQL handout/spool and credentials remain ignored and unmodified.

This is functional verification of the local classroom application, not authentication, load testing or security certification. Completed-trip locks are intentionally irreversible through normal DML. Curated collections require live Oracle and do not fabricate offline view results. Future write-test runs require approval of the fixture/cleanup plan and no concurrent database writers.
