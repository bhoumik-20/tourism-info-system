# Verification performed

## Live integration — 8 October 2026

The current local frontend environment selects the existing API at `http://localhost:5000/api` with mock mode disabled. Oracle XE 11.2 connectivity succeeded using the existing backend configuration.

- Backend `npm test`: all six integration tests passed, including their database cleanup checks.
- Frontend `npm test`: all ten tests passed. A regression test verifies filter choices reflect real scalar/collection data rather than demo-only strings.
- Frontend `npm run build`: successful production build.
- Fresh live browser tab after fixes: no captured console errors or warnings.
- Real city/user/POI records loaded. Restaurant, activity, event and place detail screens showed their subtype collections and fields.
- Browser filtering: Moderate + Parsi produced Britannia; Cycling + Winter + maximum cost 320 produced Cubbon Park Cycling; Food Festival + 26–27 December produced Mumbai Food Weekend. Palace + Mumbai produced the empty-result state; minimum rating 4.5 produced ten reviewed POIs.
- Browser-created trip 3 for user 1 persisted its name, dates and status; editing changed its name/status. Browser-created itinerary 4 persisted its parent trip, edited description and memberships for Bangalore Palace/Marine Drive. Reload preserved the plan.
- Saving previously unsaved Bangalore Palace persisted in the saved collection. A temporary browser review persisted a 4.6 rating; editing it to 4.8 updated the place average to 4.4 across two reviews.
- API readbacks independently verified browser writes. Deleting the temporary trip with its itinerary returned 409. Membership removal, itinerary deletion with a remaining membership, trip deletion, review deletion and unsaving were verified through the API during cleanup. The deletion controls had previously been exercised in demo browser testing below.
- Cleanup verified all 25 Oracle table counts and SHA-256 snapshots of REVIEW, TRIP, ITINERARY, ITINERARY_POI and USER_SAVES_POI exactly matched the pre-browser baseline. Review sequence advancement is expected and is not rolled back.
- Switching to Meera displayed her own Mumbai Weekend trip; returning to Aarav restored his two original trips.
- Stopping the test-started backend produced an actionable error and an unavailable connection label; restarting it and clicking Try again recovered the original seven saved records.
- Mobile navigation and collapsed restaurant filters worked at a 390px viewport override; document width matched its client width. Desktop was checked at 1440px. Temporary viewport overrides were reset.

Fixed during testing: dropdowns now derive real database values (including Moderate and Food Festival); restaurant/activity details supply cuisine/season choices; the footer reflects loading and connection failure accurately.

Screenshots and database audit evidence are in the ChatGPT workspace `frontend-verification/`. This is functional integration testing, not a load/security audit. The traveler selector is for the existing demonstration users; authentication is outside this scope.

## Earlier demo verification

Date: 7 October 2026. Local Node 24.19.0. Application served from the requested monorepo frontend folder at http://localhost:5173.

## Build and domain checks

- `npm run build`: successful production build with Vite 8.3.3.
- `npm test`: nine tests passed; no failures. Covers literal combined search, subtype/date/rating filters, derived rating updates, review ownership/validation, per-user saves and persistence, composite plan ownership, trip-deletion conflicts, unordered itinerary memberships, date/UTF-8 validation and storage-failure atomicity.
- Dependency installation audit: zero reported vulnerabilities at installation time.
- Supplied and copied `DESIGN.md` SHA-256 hashes match: `50424C7A15A1A1385BAD99CF897F2951AA30FD9BE802FE906269CD4F0C966079`.
- Fresh browser tab after fixes: no captured console errors or warnings.

## Browser checks

- Home and navigation to explorer, restaurants, activities, events, saved POIs, trips, trip details, itineraries and credits.
- POI search for `palace` produces two results; adding Mumbai produces the empty-result state. Reset and minimum rating 4.5 produce four reviewed records.
- Saving Marine Drive, navigating to saved POIs, reloading, and unsaving it. The initial saved collection was restored after verification.
- Restaurant cuisine filter `South Indian`: MTR and Vidyarthi Bhavan. Activity difficulty `Easy`: Bengaluru Heritage Walk.
- Inclusive event date range 15 November 2026: Bengaluru Garden Weekend, whose end date overlaps that day.
- Place, restaurant, activity and event detail pages display subtype information. All four bundled photographs loaded.
- Review insertion, rating recalculation, editing and deletion through the actual UI. Temporary verification review removed afterward.
- Trip creation and editing, date persistence, itinerary creation/editing, POI picker add/remove, and adding a POI from its detail page.
- Deleting a trip with an itinerary returns a helpful conflict message. Deleting the temporary itinerary then permits trip deletion. Temporary verification plans removed afterward.
- Current-traveler selector changes to the second demo user’s separate empty trip collection; restored to the first user afterward.
- Reloaded direct detail routes and checked unknown-route recovery.
- Desktop width 1440px and mobile width 390px. Mobile navigation opens and closes, filters collapse/expand, single-column cards and itinerary rows fit, and modal controls remain usable. Document width stayed within the viewport.
- Native dialog focus moves to the first form field and returns when closed. Mobile edit dialog visually inspected.

Screenshots were saved separately in the ChatGPT workspace under `frontend-verification/desktop-home.jpg` and `frontend-verification/mobile-explore.jpg`.

## Limits

- This earlier round used demo data. Live Oracle verification was subsequently completed as documented above.
- Stitch screen fidelity could not be measured. The supplied `DESIGN.md` design system was used; generated screen exports were unavailable.
- No separate repository was created. No dependencies, credentials or build output belong in the commit.
