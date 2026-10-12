# Voyage — Tourism Information System

BACSE202 Database Systems project: React/Vite/Tailwind frontend, Express backend, and readable bound SQL against the existing populated Oracle XE 11g TOURISM schema. This is a local classroom profile switcher without authentication.

- `backend/`: REST API and live Oracle checks. [Setup and endpoints](backend/README.md).
- `frontend/`: Voyage discovery, profiles, curated collections, reviews, saves, trips, itineraries and trip dashboard. [Run and routes](frontend/README.md).
- `database/`: existing course reference material; no automatic schema installation.
- [Phase 2 implementation](PHASE2.md), [live-write test plan](TEST_PLAN_PHASE2.md).

Start the backend on localhost:5000 and frontend on localhost:5173 in separate terminals. Use the existing local `.env` files; never commit passwords. Oracle credentials belong only in the backend. Dependencies, build output, credentials, and local SQL*Plus handouts/spools are ignored. No tables or database objects are created or altered by the application.

The public [Voyage team website](https://voyage-tourism-team.blondmoth32.chatgpt.site) connects to the existing local Oracle backend while the owner's PC and protected tunnel are running. Use the [team testing checklist](https://voyage-tourism-team.blondmoth32.chatgpt.site/team-testing). Anyone with the link can switch classroom profiles and change shared records. [Connection instructions](hosting/README.md) · [Current handoff and verification](handouts.md).
