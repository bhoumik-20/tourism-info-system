# Voyage — current project handoff

Updated: 12 October 2026 (Asia/Kolkata). This is the ongoing handoff; the existing local `handout.md` and SQL spools are preserved separately.

## Current project

- BACSE202 Tourism Information System, branded Voyage.
- Repository: https://github.com/bhoumik-20/tourism-info-system
- Local repository: `D:\huh\Fall Semester 2026\BACSE202 - Database System\Project\Code`.
- Oracle XE 11g, populated TOURISM schema with the existing 25 tables. Express uses raw parameterized SQL and node-oracledb 6.10.0 in Thick mode with the installed 11.2 Oracle client.
- React/Vite/Tailwind frontend: discovery, subtype filtering, reviews, saved POIs, trips and itineraries, profile creation/switching/statistics, six installed curated views, and the live trip dashboard.
- Schema, installed views/triggers/sequences, and Oracle credentials remain unchanged by the hosting work.

## Phase 2 checkpoint

Phase 2 was committed and pushed through `bbbd40a` (profile birth-date input and approved live verification). Previous checkpoints: `37608d4` (profiles), `eacc5b6` (collections/dashboard), and `70a12a6` (collection loading/navigation).

The prior approved live test run passed 15 backend tests and verified browser workflows. Temporary records were removed and counts/data fingerprints across all 25 tables matched the baseline. Those results are documented in `backend/TESTING.md`, `frontend/VERIFICATION.md` and `PHASE2.md`. Hosting tests below are a separate verification scope.

## Sites team website — deployment in progress

- Registered Site ID: `appgprj_6acbdcadf36c81918d1effeb0663c72d`.
- Assigned URL: https://voyage-tourism-team.blondmoth32.chatgpt.site
- Manual checklist route: `/team-testing`.
- Current audience: owner-private; team sharing choice still pending.
- Publication is not yet verified. Source synchronization and packaging are being completed before deployment.
- The user approved a protected temporary Cloudflare tunnel for live application reads and writes. The gateway/tunnel are running; Oracle and Express remain on the owner's PC.

The connection is:

`Browser → Sites /api → protected HTTPS tunnel → loopback gateway :5001 → Express :5000 → Oracle XE`.

The tunnel is protected by a server-side random key. Sites holds it as a secret; it is not included in React or Git. The Oracle password stays in the existing local backend environment file. No Oracle listener is exposed through the tunnel.

## New hosting files

- `hosting/gateway.cjs`: validates the connection key and forwards API requests to a fixed loopback Express endpoint.
- `hosting/team-connection.cjs`: starts/checks/stops the gateway and temporary tunnel; checks recorded process ownership before stopping them.
- `hosting/README.md`: running, configuration, access and maintenance instructions.
- `frontend/worker/index.js`: Sites HTTP forwarding, same-origin write checks, no-cache API responses and clear offline messages.
- `frontend/vite.sites.config.js`: separate hosted build; ordinary local Vite development retains its existing configuration.
- `frontend/src/pages/TeamTesting.jsx`: six-step manual checklist, saved in the reviewer's browser.
- `frontend/test/hosting.test.js`: simulated proxy tests for errors, headers, deletes and cross-site write rejection.
- `frontend/src/App.jsx` and `frontend/src/components/Layout.jsx`: checklist route and footer link.
- `frontend/package.json` / lockfile: patched Cloudflare hosting adapter and `build:sites` script.
- `.gitignore`: excludes the connection key, executable, process state and logs.

The Sites source checkout is in the task workspace at `sites/voyage-team-review`. It retains `.openai/hosting.json` and the independent Sites source history. The downloaded executable, `.dev.vars`, backend `.env` and SQL handoffs are not published.

## Verification so far

- Existing backend read-only checks: `/api/health`, `/api/cities` and `/api/collections` returned HTTP 200; two cities and six collections were returned.
- Protected tunnel: unauthenticated reads returned HTTP 401; authorized health/cities/collections reads returned HTTP 200.
- Local hosted-app preview: homepage and team checklist loaded; the homepage displayed real Oracle POIs and all six collections.
- Frontend plus hosting proxy suite: 17 tests passed. Proxy tests use simulated responses; they do not prove Oracle trigger execution.
- Hosted frontend production build passed. The Cloudflare compatibility date is pinned to `2026-10-06`, supported by the installed runtime. Hosting dependencies were updated to patched versions; the resulting dependency audit reported zero known vulnerabilities.
- No additional live Oracle write tests were run for hosting. The existing approved Phase 2 write/cleanup evidence remains in its testing documents.
- Production deployment, production browser checks and final sharing are pending; do not treat the assigned URL as verified live until the deployment record below confirms it.

## Run and stop team testing

Keep Oracle and the existing backend running, then from the repository root:

```powershell
node hosting/team-connection.cjs start
node hosting/team-connection.cjs status
```

The initial connection key and Sites runtime settings have been configured. A restarted temporary tunnel has a different backend hostname. Update `VOYAGE_BACKEND_URL` in the existing Site and redeploy its saved version; the team's Sites URL stays the same. Preserve `VOYAGE_TUNNEL_KEY` as a server secret.

```powershell
node hosting/team-connection.cjs stop
```

Stopping disconnects the team website's live data while leaving Oracle and the existing backend running. The PC must remain awake and online throughout a session. This is temporary classroom testing, not permanent backend hosting.

## Team instructions

Use the `/team-testing` guide. Create a clearly named test profile, then check discovery, all collections, saves/reviews, Planned trips, itineraries and dashboard totals. Keep trips Planned during disposable tests: completed trips are locked by installed Oracle triggers. Coordinate profile cleanup with the project owner because there is no profile-delete endpoint.

The navbar profile is authoritative for application ownership and persists in each browser. It is a classroom profile switcher, not authenticated identity verification. Whoever is allowed to visit the Site can select profiles and change shared records; choose the Site audience accordingly.

## Progress log

- 12 October: preserved the existing local handoff and began this current handoff. Resumed the same registered Site after an interrupted packaging step. Confirmed Oracle/backend and the approved tunnel are still running. Team access remains private pending the user's audience choice.
