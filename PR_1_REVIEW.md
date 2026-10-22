# PR #1 review — Travelling Companion frontend replacement

Reviewed on 22 October 2026 (Asia/Kolkata).

**Recommendation: request changes; do not merge this PR into the working Voyage application as submitted.** It is a standalone browser demo, while the existing BACSE202 project requires a frontend connected to Express and the populated Oracle database. A clean merge and successful build do not establish feature compatibility.

PR: https://github.com/bhoumik-20/tourism-info-system/pull/1  
Title: Replace frontend with Travelling Companion demo  
Reviewed head: `abcc0a05eb505ef107e9473a17acdc6ce7991d2e`  
Reviewed application baseline: `93082ec53a6d51e92947ababce3fea6e7c023139`  
Change scope: 11 frontend files, 1,812 insertions and 85 deletions. Backend, database, hosting gateway/worker and dependency manifests/lockfiles are unchanged. Subsequent commits recording this review change documentation only.

## Findings

### 1. [P1] The default application no longer uses the live API

`frontend/src/App.jsx:1` replaces the complete router/provider with an unconditional export of `CompanionApp`. Its active import graph contains only App, six companion modules, React and Lucide. It does not import the existing API service, profile context or React Router.

`CompanionApp.jsx:31-48` loads and persists browser demo state; all writes update arrays. `demoStore.js:11-44` reads/writes localStorage, and `demoData.js:556-645` supplies fixed fixtures. Consequently reviews, saves, trips and itinerary memberships no longer reach Express/Oracle. Shared team changes and real database records disappear from the active UI. The local environment's live-mode setting cannot restore integration because the replacement does not read the existing adapter at all.

The actual Oracle records are not deleted or changed by this source replacement; they become disconnected from the frontend. This is a blocking conflict with the purpose of the DBMS project and the existing verification evidence.

Fix: retain the live application as the default. Port the desired visual components onto the existing API/context, or make this an explicit, separately routed optional demo.

Evidence: [new entry point](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/App.jsx#L1), [demo state initialization](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/CompanionApp.jsx#L31).

### 2. [P1] Real profile creation, switching and profile details are removed

`demoData.js:558` selects fixture user 1 (Maya). The sidebar profile in `components.jsx:73-77` is a non-interactive div and chevron. There is no create/switch/edit profile workflow in the active app and no view of APP_USER attributes or derived statistics. All new user-owned records therefore use that fixed local profile instead of the selected real Oracle profile.

Fix: restore the existing navbar profile actions and authoritative selected-user context. No-profile prompts, automatically selecting a newly created Oracle user, ownership refresh/isolation, and profile aggregates must remain available.

Evidence: [profile display](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/components.jsx#L73), [fixed fixture selection](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/demoData.js#L556).

### 3. [P1] The six curated collections and required trip summary are no longer reachable

The page selection in `CompanionApp.jsx:335-358` has no curated collection or profile route. Navigation in `components.jsx:21-29` has no collections entry. The new Content curator is a local city/POI editor, not the six installed Oracle views.

`views.jsx:102-105` renders a trip and itinerary list without the existing summary component or summary API. It omits unique POIs, total memberships, subtype counts and mean reviewed-POI rating. The homepage's sample overview counters are not a replacement for the specified trip dashboard. Add to itinerary works only on local sample records and cannot demonstrate collection-to-ITINERARY_POI insertion.

Fix: retain all six view-backed collections, original POI_ID actions and live per-trip aggregates, including refresh after membership changes.

Evidence: [active page selection](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/CompanionApp.jsx#L335), [replacement trip screen](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/views.jsx#L102).

### 4. [P1] Saving a restaurant makes its detail screen crash

Reproduced in the isolated production build: Content curator → Edit MTR → Save POI without changing anything → open MTR. The React application becomes blank and the browser records `TypeError: t.paymentMethods?.join is not a function`.

`forms.jsx:155` omits `paymentMethods` from arrayFields. The submit loop at lines 179-183 therefore saves it as a string, while `views.jsx:143` expects an array and calls `.join`. This affects an ordinary restaurant edit, not just malformed input; the bad value persists in the demo store across reloads.

Fix: serialize paymentMethods as an array consistently, validate loaded records and add an interaction test covering edit/save/reopen. Merely making the display tolerate a string would leave the model inconsistent.

Evidence: [array field list](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/forms.jsx#L155), [submit conversion](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/forms.jsx#L179), [array display](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/views.jsx#L143).

### 5. [P1] The demo's successful actions contradict installed Oracle rules

Browser reproduction: mark the sample trip Completed, save it, reopen Edit, change its name, and save again. The app displays the changed name with Completed status. The real TRG_TRIP_DATE_GUARD rejects changes to completed trips (ORA-20021).

The browser also accepted an itinerary with missing dates. The installed itinerary validation requires valid trip/itinerary dates (ORA-20013). Static inspection of `forms.jsx:53-57` additionally shows no parent-trip range or event-overlap check; membership functions in `CompanionApp.jsx:170-213` check existence/duplicates only. No new live trigger tests were performed, and the attempted date-field automation was not used as proof of a persisted out-of-range date.

`CompanionApp.jsx:105-125` also cascades local trip deletion through its itineraries. The existing backend intentionally returns a conflict when a trip still has itineraries, matching the existing foreign-key behavior. Installed triggers/constraints are not modified or bypassed in Oracle; the frontend never reaches them and presents different local behavior instead.

Fix: route writes through the existing backend, preserve database failures as failures, and retain the established trigger/FK semantics in any optional offline mode. Do not alter Oracle objects to accommodate this UI.

Evidence: [trip updates](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/CompanionApp.jsx#L90), [local cascading delete](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/CompanionApp.jsx#L105), [itinerary validation](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/forms.jsx#L53).

### 6. [P2] Existing URLs, browser navigation and query filters stop working

The replacement initializes `page` to home and navigates with React state (`CompanionApp.jsx:32,52-63`). It does not use the URL or browser history. Browser verification of `/team-testing` rendered the Overview screen, not the team guide. Refreshing an internal screen returns to Overview; direct links to profiles, POIs, collections and trip/itinerary details no longer select their original screens. Search/city/type state is no longer shareable in URL parameters.

The old route files still exist on disk but are not imported by the active entry point. The hosted SPA fallback serving HTTP 200 does not fix this routing regression.

Fix: keep the established React Router routes and query-state behavior, including nested details, missing-record screens, team guide and credits.

Evidence: [page state](https://github.com/priya-02-k/tourism-info-system/blob/abcc0a05eb505ef107e9473a17acdc6ce7991d2e/frontend/src/companion/CompanionApp.jsx#L32).

### 7. [P2] Existing discovery filters and review deletion are lost

`ExploreView` only supports text/city/type and sorting (`views.jsx:64-83`). It has no minimum-rating filter, cuisine/price/service filters, activity difficulty/season/cost filters or event date-range filters. `ReviewsView` and `PoiDetailView` offer review editing but no deletion action, and CompanionApp has no review-delete handler.

Fix: preserve the supported REST filtering and full review CRUD through the existing adapter. Extend behavioral tests to the active UI rather than leaving old helper tests green but unused.

## Other compatibility considerations

- **Git conflicts:** GitHub reported mergeable=true and mergeable_state=clean. Local `git merge-tree --write-tree` succeeded against the reviewed main revision. There are no detected textual merge conflicts; the blockers above are functional/project conflicts.
- **Database/schema:** no backend, database, DDL, grant, trigger, view or sequence changes. No ORM/auth framework/Redis/Docker or new dependencies were introduced. This is positive, but preserving those files does not preserve the application's connection to them.
- **Persistence:** the new storage key is `travelling-companion-demo-v1`. It neither loads real Oracle data nor migrates the prior selected-profile/offline state. Separate teammates/browsers see separate data. It does not erase the old data stores.
- **Styles:** the PR appends global :root/body/button/modal selectors to the original stylesheet. If retained as an optional demo, scope these styles so they do not override the live app's controls and typography. The compiled normal CSS grows substantially because both stylesystems remain.
- **Documentation:** frontend/README explicitly and honestly identifies this as a local demo. Root README, PHASE2, hosting instructions, design reference and verification records still describe the live app. They must not be presented as verification of the replacement. Photography credits are no longer reachable despite reuse of the existing image files.
- **Hosting:** both build variants pass. Merging GitHub source alone does not update the independently published Sites version. Publishing this replacement would show local sample data even when its unchanged Sites worker and Oracle API are available. The public worker/API access-control limitations from the prior security review are not resolved by an offline UI.
- **Credentials:** the 11 changed text files contained no matches for the configured database password/tunnel key or common provider-token/private-key patterns. No secret values were printed. This scoped scan is not a full security certification.

## Verification actually performed

| Check | Result |
| --- | --- |
| GitHub and local textual merge checks | Clean at the reviewed revisions |
| Reported GitHub CI checks/statuses | None reported for the reviewed head |
| Frontend test suite | 21 passed: 17 retained tests and 4 new fixture-consistency tests |
| Normal production build | Passed in an isolated source snapshot |
| Sites production build | Passed in the same snapshot |
| Dependencies | Reused installed dependencies only after confirming lockfile SHA-256 equality; no dependency installation or lockfile changes |
| Browser startup | Renders the 15-POI sample catalog and fixed Maya profile |
| Restaurant edit/save/reopen | Fails: paymentMethods.join TypeError and blank application |
| Completed-trip edit | Incorrectly succeeds in local demo |
| Missing-date itinerary | Incorrectly succeeds in local demo |
| Existing /team-testing direct link | Incorrectly renders Overview |
| Test cleanup | Isolated browser sample data reset to original fixture; review preview stopped |
| Live Oracle writes / migrations / production deployment | Not performed |

The passing tests do not mount the new form workflows or establish active API integration. In particular, the restaurant crash is reproducible while all 21 tests pass. The four new tests validate fixture referential consistency, not CRUD, routing, profiles or Oracle rules.

## Conditions for a future approval

1. Decide whether the change is a visual redesign of the live product or a separately selectable demonstration. Keep the live application as default unless project requirements are explicitly changed.
2. Preserve the existing API adapter, authoritative selected profile, all required routes, six collections, dashboard and write/error-refresh flows. Do not introduce new Oracle objects or schema changes.
3. Fix restaurant serialization and add tests for actual user interactions, including save/reopen, no-profile flows, switching isolation and route reloads.
4. Keep database constraints/triggers authoritative. Test valid/invalid itinerary dates, completed trips, memberships and deletion dependencies through the real API under an approved temporary-data/cleanup plan.
5. Scope demo styles, retain accessible navigation/dialog behavior and image attribution, and reconcile the documentation with the final implementation.

Until these are addressed, keep this branch as a prototype or extract selected visual components into smaller PRs. Do not merge the wholesale replacement into main.
