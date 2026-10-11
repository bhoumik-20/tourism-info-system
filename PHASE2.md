# Voyage Phase 2 implementation

## Profiles and ownership

`backend/src/controllers/users.js` uses APP_USER and independent COUNT subqueries for reviews, saves, trips and itineraries. POST allocates with the manually installed APP_USER_ID_SEQ; PUT edits existing attributes. No schema or administrative SQL is executed. First_Name and Email are required; the inspected Oracle byte lengths are enforced by backend validation.

`frontend/src/context/AppContext.jsx` owns the active ID, with storage helpers in `context/profileSelection.js`. `components/Profiles.jsx` supplies the navbar menu, real-user switcher, create/edit form, avatar and no-profile prompts; `pages/Profile.jsx` displays full attributes and statistics at `/profile`. Successful creation automatically selects the returned ID. User switches clear scoped data and invalidate pending loads; keyed routes remount forms. Review updates/deletes also constrain the SQL to the selected owner. This is local classroom profile selection, not authentication.

## Installed views and collections

`backend/src/controllers/collections.js` has a fixed slug/view/column whitelist based on the handoff and live metadata. All six views are queried through SELECT only:

| Slug | Installed view |
| --- | --- |
| top-rated | VW_TOP_RATED_POIS |
| popular | VW_POPULAR_POIS |
| budget | VW_BUDGET_EXPERIENCES |
| foodie | VW_FOODIE_FAVORITES |
| upcoming | VW_UPCOMING_EVENTS |
| hidden-gems | VW_HIDDEN_GEMS |

`GET /api/collections` returns live counts; `/api/collections/:slug` accepts bound city/type/page/limit values. The frontend loads all result pages, normalizes CHAR types and list fields, and preserves the original POI_ID. Unknown budget prices remain unknown rather than becoming free.

`components/CollectionsSection.jsx` appears on Home and `/collections`; `pages/Collections.jsx` supplies `/collections/:slug`. The shared POICard uses the shared AddToItinerary picker from `pages/Itinerary.jsx`. It uses the active profile's trips, then that trip's itineraries; it posts the original ID to `/api/users/:userId/itineraries/:itineraryNo/pois/:poiId`. Existing memberships are disabled, concurrent duplicates return 409, and trigger errors remain failures. Successful mutations refresh the shared revision, itinerary data, collection results and dashboard. Missing plans link to their creation screens.

## Genuine Oracle trigger feedback

The database remains the final authority. The Express error middleware in `backend/src/app.js` recognizes the installed trigger codes and returns readable messages with the original ORA code. The central frontend request helper preserves the status/code and forms display the message.

| Code | Installed rule | HTTP |
| --- | --- | --- |
| ORA-20011 | Cannot change an itinerary under a completed trip | 409 |
| ORA-20012 | Parent trip missing | 404 |
| ORA-20013 | Trip/itinerary dates missing or invalid | 400 |
| ORA-20014 | Itinerary lies outside trip dates | 400 |
| ORA-20015 | Itinerary date change conflicts with an existing event | 409 |
| ORA-20021 | Completed trip cannot be updated/deleted | 409 |
| ORA-20022 | Trip end precedes start | 400 |
| ORA-20023 | Trip date change would invalidate an itinerary | 409 |
| ORA-20031 | Cannot change membership under a completed trip | 409 |
| ORA-20032 | Target itinerary/parent trip missing | 404 |
| ORA-20033 | Event and itinerary dates do not overlap | 409 |

TRG_REVIEW_TIMESTAMPS provides initial Review_Date/Last_Updated and preserves Review_Date on edit. Express does not override it. TRG_ITINERARY_VALIDATE, TRG_TRIP_DATE_GUARD and TRG_ITINERARY_POI_GUARD remain untouched. Some malformed requests are rejected earlier by normal API validation, without bypassing the triggers for valid DML.

## Live trip dashboard

`backend/src/controllers/summary.js` serves `/api/users/:userId/trips/:tripNo/summary`; `components/TripSummary.jsx` renders it on the existing Trip Details route. Trip name, dates and status remain in the page header.

The query isolates the user's trip itineraries, counts memberships using LEFT JOIN and COUNT(DISTINCT POI_ID), derives a unique-POI CTE, groups reviews per POI, then LEFT JOINs the four existing subtype tables. Subtype counts and the rating mean operate on unique POIs. The displayed mean gives each reviewed POI equal weight, excludes unrated POIs and is null for an unreviewed/empty trip. Repeated stops increase membership count but not unique counts or rating weight. No stored function, procedure or database object is introduced.

## Verification

See [backend/TESTING.md](backend/TESTING.md) for actual execution results and [TEST_PLAN_PHASE2.md](TEST_PLAN_PHASE2.md) for live fixture/cleanup approval details. Frontend unit tests use only offline data; read-only backend tests use real Oracle GET/SELECT operations. Write tests are guarded and must be approved before execution.

No new dependency, authentication framework, ORM, Docker, Redis, migration or seed system is used. The local SQL*Plus spool and handout remain ignored and unmodified. Profiles can be edited, but no profile-deletion endpoint is added. Completed-trip locking is intentionally irreversible through the normal app, following the installed triggers.
