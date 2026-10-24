# Voyage · Tourism Information System frontend

React + Vite + Tailwind CSS + React Router, inside the existing `tourism-info-system` monorepo. No separate backend or authentication service.

## Active frontend: Travelling Companion local demo

The active app entry (`src/App.jsx`) now opens the Travelling Companion demo. It uses curated sample records and browser `localStorage`; it does not call the existing API or connect to a backend or database. The existing API service files, environment examples, backend, and database are retained unchanged. The route and live-integration descriptions below document the previous API-integrated frontend and are not active in this demo.

From this directory, with Node.js 22.12 or newer, run:

```sh
npm ci
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Run `npm test` for frontend tests and `npm run build` for the production bundle. The demo covers city/POI discovery, saves, reviews, trips, itineraries, curator sample data, and POI relationships. Changes persist only in the current browser; use **Reset sample data** in the sidebar to restore the initial fixture.

## Run locally

From `Code/frontend` with Node.js 22.12+ (verified on Node 24.19):

```powershell
npm install
# Optional: copy only if .env does not already exist.
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173**. `npm run build` produces an ignored `dist/` folder. `npm run preview` serves it at **http://localhost:4173**. `npm test` runs the offline domain, profile persistence and collection-normalization tests without touching Oracle.

## Design reference

`DESIGN.md` is an unchanged copy of the supplied Voyage TIS design specification. The detailed component sections specify teal `#0D9488`, slate `#0F172A`, canvas `#F8FAFC`, white cards, amber ratings, Inter, 16px card radii and a 280px desktop filter sidebar. Those sections take precedence over the conflicting generated YAML palette. Fonts and four landmark photographs are bundled locally; images have visible credits and a `/credits` page.

The Stitch screens/export were inaccessible during implementation. This is an implementation of the supplied design system and requested application structure, **not a verified screen-for-screen copy of Stitch**. See `IMPLEMENTATION.md` for scope and remaining gaps.

## Data and backend

The default is **live Oracle mode**. Configure the local frontend `.env` (no database passwords):

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK_DATA=false
```

Explicit `VITE_USE_MOCK_DATA=true` enables the existing offline demonstration. Its changes persist separately under `voyage-tis-demo-v1`. Curated collections require the actual Oracle views and are intentionally unavailable in offline mode.

Restart Vite after changing environment variables. Start the existing `../backend` following its README. Keep its `FRONTEND_ORIGIN=http://localhost:5173`. Do not put Oracle credentials in the frontend. Only variables prefixed with `VITE_` are exposed to client code.

`src/services/api.js` contains all network requests and the adapter for the actual camelCase `{ data }` contracts. It chooses demo or live mode explicitly, handles 204/errors/timeouts and reads pagination. It does not silently replace failed live requests with demo data. Live mode discovers real user IDs and preserves `userId + tripNo` / `userId + itineraryNo` composite ownership.

Live integration was verified on 8 October 2026 against the existing Oracle XE database. The current ignored local `.env` selects live mode. Browser-created saves, reviews, trips, itineraries and memberships persisted through the API and reloads; all temporary records were removed and database counts/checksums restored. See `VERIFICATION.md`. Filter choices come from actual database values, including cuisine and season collections loaded from subtype details.

## Routes

| Route | Screen |
| --- | --- |
| `/` | Home and city discovery |
| `/explore` | Search/filter all POIs |
| `/restaurants` | Dining search and cuisine/price/service filters |
| `/activities` | Activity type, difficulty, season and budget filters |
| `/events` | Event type and overlapping date-range filters |
| `/profile` | Active profile attributes, aggregate statistics and edit form |
| `/collections` | All six curated collections with live counts |
| `/collections/:slug` | Curated view rows, city/type filters, save and add-to-itinerary |
| `/pois/:id` | Full subtype details, reviews, save and add-to-itinerary |
| `/saved` | Current user's saved POIs |
| `/trips` | Create/edit/delete trips |
| `/trips/:tripNo` | Trip details, live summary dashboard and itinerary management |
| `/itineraries/:id` | Edit itinerary, add/remove POI memberships |
| `/credits` | Photography sources and licences |

Search and filters are stored in URL parameters. Unknown routes and missing records have helpful fallback screens. Vite supports direct route reloads; other static hosting would need an `index.html` fallback.

## CRUD demonstration

- **INSERT:** create trip/itinerary, add review, save POI, add itinerary membership.
- **UPDATE:** edit trip/itinerary/review.
- **DELETE:** remove review/saved POI/membership, delete itinerary/trip.
- **SEARCH:** combine text, city, rating and subtype-specific filters.
- **DISPLAY:** cards, subtype metadata, reviews, saved POIs and plans.

A trip with itineraries cannot be deleted, matching the existing backend's FK rules. Itinerary POIs are shown by name: the database has no visit-order column, so no ordering or scheduling persistence is invented. No login or authentication is required. Select or create the active traveler using the top-right profile menu. The selected ID persists under `voyage-active-profile`; there is no automatic demo-user fallback. With no profile, user-owned actions open the profile selector.

Switching clears the old profile data immediately, remounts user-owned forms, and discards late responses. Reviews, saved POIs, trips, itineraries and itinerary pickers use this shared ID. Profile statistics use Oracle aggregates. A successful write refreshes scoped data, curated counts and the live trip dashboard.

Every curated card retains the original POI_ID and offers Save and Add to Itinerary. The picker shows the active traveler's real trips and their itineraries; existing memberships are disabled. If none exist, it links to trip/itinerary creation. The API writes only ITINERARY_POI, never a view or a duplicate POI. Trigger conflicts appear as readable feedback. The profile switcher does not provide secure authentication.
