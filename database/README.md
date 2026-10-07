# Existing Oracle database

The API uses the already populated `TOURISM` schema on `localhost:1521/XE` (Oracle XE 11.2.0.2).

The existing `tourism_db_implementation.txt` SQL*Plus transcript is preserved locally and excluded from Git. It is a reference transcript, not a clean migration script. Do not replay it against the populated database.

`npm run setup:db` in `backend/` adds only `REVIEW_ID_SEQ`, starting above existing review IDs. No tables, seed rows, views, functions, or triggers are created or replaced. The TOURISM user needs `CREATE SEQUENCE` for this one-time setup (the existing RESOURCE role provides it).

Trip and itinerary numbers are allocated per user inside a transaction using an APP_USER row lock. Foreign keys use NO ACTION: a trip with itineraries cannot be deleted until those itineraries are removed. Itinerary deletion removes its POI associations in the same transaction.
