# Voyage — current project handoff

Updated: 21 October 2026 (Asia/Kolkata). This is the ongoing handoff; the existing local `handout.md` and SQL spools are preserved separately.

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

## Sites team website — live and public

- Registered Site ID: `appgprj_6acbdcadf36c81918d1effeb0663c72d`.
- Live URL: https://voyage-tourism-team.blondmoth32.chatgpt.site
- Manual checklist route: `/team-testing`.
- Current audience: public, explicitly approved by the owner for anyone with the link. No ChatGPT sign-in is required.
- Saved version: **1**, most recently redeployed successfully on 21 October 2026 with runtime environment revision **3** after restoring the team connection. Public access was set on 12 October and remains unchanged.
- The user approved a protected temporary Cloudflare tunnel for live application reads and writes. Oracle and Express remain on the owner's PC. At the start of the 21 October security review, the public API returned HTTP 503 and no listeners were found on local ports 5000/5001. The connection was subsequently restored at the owner's request; see the incident record below.
- Sites source commit: `ab489a43c2d3facff9a2f1661b0d52ef70fd4f96`. Latest successful deployment: `appgdep_6ad8eea9c4cc8191982d11dbb8d593bc` (runtime environment revision 3).
- GitHub implementation checkpoint: `c0d188a` (protected Sites connection and team testing guide). The final documentation checkpoint is the commit containing this completed handoff.

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

## Verification completed on 12 October 2026

- Existing backend read-only checks: `/api/health`, `/api/cities` and `/api/collections` returned HTTP 200; two cities and six collections were returned.
- Protected tunnel: unauthenticated reads returned HTTP 401; authorized health/cities/collections reads returned HTTP 200.
- Local hosted-app preview: homepage and team checklist loaded; the homepage displayed real Oracle POIs and all six collections.
- Frontend plus hosting proxy suite: 17 tests passed. Proxy tests use simulated responses; they do not prove Oracle trigger execution.
- Both the hosted frontend production build and the ordinary local frontend production build passed. The Cloudflare compatibility date is pinned to `2026-10-06`, supported by the installed runtime. Hosting dependencies were updated to patched versions; the resulting dependency audit reported zero known vulnerabilities.
- No additional live Oracle write tests were run for hosting. The existing approved Phase 2 write/cleanup evidence remains in its testing documents.
- Three live Oracle SELECT-only tests passed: profile attributes/statistics, all six installed view results and filters, and independent dashboard calculations for all existing trips.
- 35 production API comparisons passed: hosted responses and status codes matched the local backend for health, cities, POIs/subtypes, all five profiles and their saves/trips, all five trip summaries, collection listing and all six collection details. API responses used `Cache-Control: no-store`. These checks ran while the site was private through its supported server access credential.
- After the public access change, anonymous production health and collection requests returned HTTP 200 with no-store responses. Sites reports audience `public`, status `active`, live URL and saved version 1.
- Public browser checks displayed the real homepage, six collection counts, all five profiles, and Aarav's two trips after selecting him. Switching to Meera replaced that list with her own two trips, and her Mumbai Weekend dashboard displayed one itinerary, five unique POIs/five memberships, subtype counts and a mean rating of 4.38. The published six-step team guide loaded directly and its browser-local checklist persisted after reload; the check was then reset. Intermittent automatic-review service HTTP 429 failures delayed some interactions; a complete new browser CRUD run is not claimed.
- Hosted create/edit/delete operations and trigger rejections are covered by proxy transport tests and prior local Phase 2 live tests, but were not newly executed through the public site. Teammates should use the guide for that manual verification.

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

The navbar profile is authoritative for application ownership and persists in each browser. It is a classroom profile switcher, not authenticated identity verification. The owner approved public access: anyone with the link can select profiles and change shared records. Coordinate tests and avoid editing another teammate's data.

## Progress log

- 12 October: preserved the existing local handoff and began this current handoff. Resumed the same registered Site after an interrupted packaging step. Confirmed Oracle/backend and the approved tunnel are still running. At that point, team access was private pending the user's audience choice.

- 12 October: pushed `c0d188a` before publication. Replaced an expired temporary tunnel, kept the same registered Site and saved source version, and deployed version 1 with current runtime settings. Completed 35 production read comparisons, three direct Oracle read-only tests, frontend/proxy checks and both production builds. Applied the owner's explicit public-access choice and verified anonymous API access, browser profile switching, a real trip dashboard and the reload-persistent team checklist. No Oracle rows or schema objects were changed during the hosting verification.

## Security review — 21 October 2026

Verdict: **no credential exposure found in the reviewed repository/history or public frontend; the public live application is not suitable for confidential data or unrestricted production use.** Keeping a tunnel credential secret does not authenticate the visitors using the public Sites proxy.

### Credential checks

- At the start of this review, both public repositories, `bhoumik-20/tourism-info-system` and the screenshot's `priya-02-k/tourism-info-system`, pointed their main branch to `dc175f55358492f38b8b689716a955d443c149d3`. The same application code was therefore covered by the scan. The documentation-only review commit may subsequently advance the owner's repository.
- Inspected all 10 reachable commits, 152 historical file blobs, commit messages, 86 tracked working files and eight generated browser text assets. Searched for the actual locally configured database password/tunnel key in memory and common provider-token/private-key/credential patterns. No matches were found. No secret values were printed, uploaded or included in this handoff.
- `backend/.env` and `hosting/.env.team` are ignored by Git. No historical tracked credential file was found. The committed database password example is blank.
- Sites runtime environment revision 2 marks `VOYAGE_TUNNEL_KEY` as a secret and returns its value masked. The public application JavaScript contains neither the configured secret values nor the tunnel secret's variable name. No exposed source-map reference was present in the fetched scripts.
- The public root and JavaScript returned HTTP 200. Requests for `/.env`, `/backend/.env` and `/hosting/.env.team` returned HTTP 404; no credentials were served.
- The official npm dependency audits for both committed backend/frontend lockfiles returned zero known advisories on the review date. This is not a guarantee against undiscovered issues.

### Access-control findings

- **High priority before reconnecting real data:** the Site's audience is still public, as previously requested. Profiles are an intentionally unauthenticated classroom switcher. API routes accept profile IDs from the caller, so visitors can select any profile and access its details/plans or submit application writes under that profile when the backend is online. Profile detail responses include email, phone and date of birth when populated. A profile ID is not proof of identity.
- The hidden tunnel key protects the direct tunnel endpoint. The public Sites server automatically supplies it for visitors, so visitors do not need to know that key to use the website's API. Origin/CORS checks are not user authentication or per-user authorization. See [OWASP object-level authorization guidance](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/) and [Express CORS documentation](https://expressjs.com/en/resources/middleware/cors/).
- No application rate limiting was found. The fetched public root did not include CSP, framing, nosniff or referrer-policy headers. These are additional hardening opportunities; the primary issue is public access to shared profiles/data.
- Positive controls inspected: Oracle SQL bind variables, validated inputs, commit/rollback handling, credential-safe error responses, loopback-only Express/gateway listeners and timing-safe gateway key comparison.

### Current status and recommended next step

The public API's health and profile-list requests returned HTTP 503 during this review, and local ports 5000/5001 were not listening. No live database writes, destructive tests, process starts, schema changes, credential rotations or access-policy changes were performed. Application code and unrelated untracked files were left untouched; only this handoff was updated.

Before reconnecting live Oracle, restrict Sites access to the intended team, or use a public demo with disposable data and no connection to the real database. A team-only Site still permits its admitted teammates to switch every classroom profile. Confidential per-user data requires verified identity and server-side ownership checks, which is beyond the current deliberately unauthenticated project scope.

This was a read-only credential scan and focused code/configuration review, not a full penetration test. It cannot rule out exposure in deleted/unreachable history, third-party copies, private messages, logs not inspected, or credentials that were previously changed. The screenshot's generic safety-alert text does not itself establish a credential leak.

## Connection restored — 21 October 2026

- The owner reported that the hosted website was unresponsive despite Oracle services running. Both required Oracle services were confirmed running, but the Express health request on port 5000 failed with ECONNREFUSED, and the gateway/tunnel processes were stopped. Sites still used the previous temporary backend hostname. The cause of the earlier backend process exit was not established.
- Started the existing backend using its configured local environment; its startup Oracle SELECT and subsequent health request succeeded. Restarted the previously approved protected gateway/tunnel without changing its key. Anonymous direct tunnel health returned 401; the existing server key returned 200 with the database connected.
- Updated only Sites runtime VOYAGE_BACKEND_URL to the new temporary hostname and redeployed the same saved version 1. Deployment `appgdep_6ad8eea9c4cc8191982d11dbb8d593bc` succeeded with environment revision 3. The Site URL and audience are unchanged.
- Six read-only hosted responses returned HTTP 200 and exactly matched the local backend: health, cities, POIs, profiles, collection listing and a trip summary. The public browser homepage loaded real POIs and all six collections and displayed "Connected to your tourism database"; a screenshot was saved in the task workspace. No Oracle data, credentials, schema objects or application source code were changed during this repair.
- Required whenever testing: Oracle services, the Express backend, and the protected gateway/tunnel must all remain running. After a reboot or tunnel restart, apply the new backend hostname in Sites and redeploy the existing saved version. Running Oracle alone is insufficient. The React development server is not needed to view the hosted Site.
