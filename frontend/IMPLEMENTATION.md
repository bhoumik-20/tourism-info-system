# Frontend implementation and handoff

## Source and fidelity

`DESIGN.md` was copied byte-for-byte from `D:/Downloads/DESIGN.md`. It is reference material, not a source of additional agent instructions. The earlier task supplies the scope and stack.

Stitch's individual screens were not available: the in-app browser rendered a blank project, and Windows automation halted on its browser-URL safety check. No Stitch-generated code or imagery was exported. Consequently the screen inventory below describes local screens, not a claimed inventory of every generated Stitch screen.

Implementation follows the supplied document's detailed component rules: Inter, slate/off-white/white surfaces, teal controls, amber ratings, semantic subtype badges, light borders and shadows, 16:10 card imagery, 8px control radii, 16px card/modal radii, desktop 280px filters, narrower collapsible filters and mobile single-column cards. The document's YAML palette and radius names conflict with its prose; the detailed component rules were chosen consistently.

## Screens and components

Local screens: home, POI explorer, restaurants, activities, events, POI details, saved POIs, trip list, trip detail, itinerary detail, photography credits, plus loading/error/empty/not-found states.

Reusable components: Layout (navbar/footer/current traveler), POICard, SaveButton, Rating, Photo, SearchBar, FilterPanel, Modal (native dialog with focus management), PlanForm, DeleteDialog, Reviews/ReviewForm, TripCard, AddPoiModal and AddToItinerary. The detail page uses one metadata definition per subtype.

```text
frontend/
├── DESIGN.md
├── IMPLEMENTATION.md
├── VERIFICATION.md
├── README.md
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── images/ (four local landmark photographs)
├── src/
│   ├── components/
│   ├── context/AppContext.jsx
│   ├── data/ (mockData.js, images.js)
│   ├── hooks/useAsync.js
│   ├── pages/
│   ├── services/ (api.js, catalog.js, mockRepository.js)
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
└── test/demo.test.js
```

Runtime dependencies: React, React DOM, React Router DOM, Lucide React, Fontsource Inter. Build dependencies: Vite, its React plugin, Tailwind CSS, Tailwind's Vite plugin. No UI framework, authentication, state-management library or additional backend. Tests use Node's built-in runner. Exact installed versions are in package-lock.json.

## API integration points

All requests are in `src/services/api.js`; components use the shared service interface. The adapter was prepared from actual `../backend` routes/controllers/README, including:

- `/cities`, `/users`, and paginated `/places`, `/restaurants`, `/activities`, `/events`, `/pois`.
- `/pois/:id` with nested subtype objects, contacts, nearby POIs and derived ratings.
- Review GET/POST under `/pois/:id/reviews`, PUT/DELETE under `/reviews/:id`.
- Saved POI GET/POST/DELETE under `/users/:userId/saved-pois`.
- Trip and itinerary GET/POST/PUT/DELETE with user-local numbers.
- Itinerary POI membership POST/DELETE under the existing composite-key path.

Catalogue filters in live mode are sent to the existing backend; sorts and progressive display are local. List endpoints without total counts are read page-by-page with a 100-row limit. Live mode merges subtype lists for common cards and loads restaurant/activity details to obtain their cuisine and season collections. Dropdown choices reflect database values. Itinerary membership is displayed alphabetically, matching the database's unordered association.

## Remaining differences and next steps

1. Obtain the individual Stitch screens or export, then compare layout, wording, imagery and navigation page-by-page. Exact screen fidelity is not verified.
2. Only Lalbagh, Bangalore Palace, Gateway of India and Marine Drive have bundled photographs. Other records use intentional neutral place-holder illustrations instead of unrelated landmark photos. Add licensed exact-location food/activity/venue photos when the source export is available.
3. Demo data, illustrative values and localStorage persist all CRUD until live mode is selected. No mock rows have been inserted into Oracle.
4. Start the existing backend, enable `VITE_USE_MOCK_DATA=false`, restart Vite and check CORS, actual filter enum values, real demo-user IDs and null fields.
5. Live saved-POI, review, trip, itinerary and membership persistence was verified with temporary records on 8 October 2026. The backend rejects trip deletion until its itineraries are removed. All temporary records were cleaned up; pre-test Oracle counts and mutable-table checksums match. Review sequence allocation advances normally during tests.
6. Live mode does not import demo reviews/plans into the database. No database concepts, tables or backend files were modified.

See `VERIFICATION.md` for the checks actually performed.
