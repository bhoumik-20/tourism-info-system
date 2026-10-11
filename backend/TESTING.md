# Backend verification

Phase 2 checks against the existing local TOURISM database (11 October 2026): Node 24.19.0 x64, Express 5.2.1, node-oracledb 6.10.0 Thick mode, bundled XE client/server 11.2.0.2.0.

- `npm run check:schema`: passed SELECT-only checks for all six valid views, four valid/enabled triggers, REVIEW_ID_SEQ and the manually created APP_USER_ID_SEQ.
- `npm run test:read`: **3 passed, 0 failed** against real Express/Oracle. Profile attributes/statistics match independent counts; all six view results, original IDs, city/type filters and unknown prices match installed views; every existing trip summary matches independently deduplicated memberships and rating calculations.
- Frontend `npm test`: **14 passed, 0 failed**, offline domain/profile/collection tests without database writes.
- Frontend `npm run build`: passed.

Live write suites and browser write checks are pending explicit user approval of TEST_PLAN_PHASE2.md. No Phase 2 write or trigger-rejection test is claimed as verified yet. The suites include existing CRUD/search regression coverage, temporary profile ownership, six-view additions, genuine trigger failures, distinct dashboard counts and all-table cleanup verification. The approval environment flag is required before writes.

Historical Phase 1 results were six live backend tests passing on 7 October and live frontend CRUD verification on 8 October. They do not replace rerunning the updated suites against the installed triggers.
