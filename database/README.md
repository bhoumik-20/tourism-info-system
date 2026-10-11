# Existing Oracle database

The API uses the already populated `TOURISM` schema on `localhost:1521/XE` (Oracle XE 11.2.0.2).

The existing `tourism_db_implementation.txt` SQL*Plus transcript is preserved locally and excluded from Git. It is a reference transcript, not a clean migration script. Do not replay it against the populated database.

All database objects are installed manually by the user. The application never executes DDL, GRANT, seed, migration or installation scripts. `npm run check:schema` in `backend/` performs SELECT-only validation of the existing APP_USER_ID_SEQ, REVIEW_ID_SEQ, six views and four enabled triggers. The former setup command is removed and its legacy script is disabled. Local `views_triggers_spool.txt` and `handout.md` are preserved and excluded from Git.

Trip and itinerary numbers are allocated per user inside a transaction using an APP_USER row lock. Foreign keys use NO ACTION: a trip with itineraries cannot be deleted until those itineraries are removed. Itinerary deletion removes its POI associations in the same transaction.
