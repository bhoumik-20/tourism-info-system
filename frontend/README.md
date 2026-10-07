# Voyage · Tourism Information System frontend

React + Vite + Tailwind CSS + React Router, inside the existing `tourism-info-system` monorepo. No separate backend or authentication service.

## Run locally

From `Code/frontend` with Node.js 22.12+ (verified on Node 24.19):

```powershell
npm install
# Optional: copy only if .env does not already exist.
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173**. `npm run build` produces an ignored `dist/` folder. `npm run preview` serves it at **http://localhost:4173**. `npm test` runs the demo-domain tests without touching Oracle.

## Design reference

`DESIGN.md` is an unchanged copy of the supplied Voyage TIS design specification. The detailed component sections specify teal `#0D9488`, slate `#0F172A`, canvas `#F8FAFC`, white cards, amber ratings, Inter, 16px card radii and a 280px desktop filter sidebar. Those sections take precedence over the conflicting generated YAML palette. Fonts and four landmark photographs are bundled locally; images have visible credits and a `/credits` page.

The Stitch screens/export were inaccessible during implementation. This is an implementation of the supplied design system and requested application structure, **not a verified screen-for-screen copy of Stitch**. See `IMPLEMENTATION.md` for scope and remaining gaps.

## Data and backend

The default is **demo mode**. `src/data/mockData.js` centralizes 24 POIs, two cities, two demo users, reviews, saved POIs, trips and itineraries. Changes persist under `voyage-tis-demo-v1` in browser localStorage. Demonstration fees, hours, ratings and event dates are illustrative.

To use the existing Oracle backend, configure a local `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK_DATA=false
```

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
| `/pois/:id` | Full subtype details, reviews, save and add-to-itinerary |
| `/saved` | Current user's saved POIs |
| `/trips` | Create/edit/delete trips |
| `/trips/:tripNo` | Trip details and itinerary management |
| `/itineraries/:id` | Edit itinerary, add/remove POI memberships |
| `/credits` | Photography sources and licences |

Search and filters are stored in URL parameters. Unknown routes and missing records have helpful fallback screens. Vite supports direct route reloads; other static hosting would need an `index.html` fallback.

## CRUD demonstration

- **INSERT:** create trip/itinerary, add review, save POI, add itinerary membership.
- **UPDATE:** edit trip/itinerary/review.
- **DELETE:** remove review/saved POI/membership, delete itinerary/trip.
- **SEARCH:** combine text, city, rating and subtype-specific filters.
- **DISPLAY:** cards, subtype metadata, reviews, saved POIs and plans.

A trip with itineraries cannot be deleted, matching the existing backend's FK rules. Itinerary POIs are shown by name: the database has no visit-order column, so no ordering or scheduling persistence is invented. No login or authentication is required; choose the current demo traveler in the header.
