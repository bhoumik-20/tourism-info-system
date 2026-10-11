# Phase 2 live-write test approval plan

No write tests run until the user approves this plan. `test:read` uses GET/SELECT only. Live suites require VOYAGE_LIVE_TESTS_APPROVED=1 after human approval; the environment flag is a guard, not a substitute for that approval.

## Temporary fixtures

- Two new profiles: VoyageTestA and VoyageTestB, with run-specific emails at example.invalid. No existing profile is edited or deleted by Phase 2 tests.
- One Planned trip per new profile; two dated itineraries under profile A. Existing regression tests also create short-lived reviews, saved associations, trips, and itineraries for the first existing demo profile, deleting only records they create.
- One new review and saved association for profile A, plus temporary memberships referencing existing POI IDs. No POIs, cities or subtypes are inserted or edited.
- Every nonempty curated collection contributes a real POI to an itinerary; duplicate membership and incompatible-event errors are checked.
- A temporary trip/itinerary/membership for completed-trip guards is created, completed, tested and rolled back on the SAME Oracle connection. A completed trip is never committed and no trigger is disabled or bypassed.

## Cleanup and verification

- Remove temporary memberships first, then itineraries, trips, reviews, saved associations and the two new profiles using their recorded IDs.
- Cleanup runs in finally/after hooks, including after failed assertions. Never delete by a broad name or email prefix.
- Compare row counts and SHA-256 hashes for all 25 tables before and after the Phase 2 suite. The existing regression suite also verifies its mutable-table hashes.
- Existing records and database objects remain unchanged. User/review sequences advance normally; Oracle cannot roll back sequence consumption.
- No DDL, GRANT, seed, migration or installation script is executed.

The same approval also covers browser checks using newly created VoyageBrowserTest profiles at example.invalid, their own Planned trips, dated itineraries, reviews, saves and memberships. Browser fixture IDs are recorded for equivalent cleanup and hash verification. No completed browser trip is created. Run while nobody else is modifying the demonstration database.
