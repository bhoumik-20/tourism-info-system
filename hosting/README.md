# Voyage team testing

Sites hosts the existing React application and a small HTTP forwarding endpoint. Express and Oracle XE remain on the project owner's Windows PC. No Oracle objects, tables, permissions or credentials are installed in Sites.

Site: https://voyage-tourism-team.blondmoth32.chatgpt.site

Team checklist: https://voyage-tourism-team.blondmoth32.chatgpt.site/team-testing

## Start a testing session

1. Keep Oracle XE running and start the existing backend as described in `backend/README.md` (port 5000).
2. Download the official Windows x64 executable from [Cloudflare](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) to `hosting/.runtime/cloudflared.exe`. A portable copy was downloaded during the initial setup; no Windows service is installed.
3. From the repository root, run:

```powershell
node hosting/team-connection.cjs start
```

The launcher creates a random local `hosting/.env.team` key if needed, starts a gateway on loopback port 5001, and opens a temporary Cloudflare HTTPS tunnel to that gateway. The key, executable, process IDs and logs are ignored by Git. The launcher does not read the backend's Oracle password or change Oracle data.

4. In Sites, set runtime `VOYAGE_BACKEND_URL` to the printed HTTPS URL and `VOYAGE_TUNNEL_KEY` to the existing local key **as a secret**. Deploy the latest saved Site version to apply changed runtime settings. Initial values are configured already. Do not paste the key into chat, source code, frontend environment files, URLs or GitHub.
5. Share the website only with the approved audience. The current access policy is controlled in Sites. A classroom profile switcher is not authenticated identity; approved visitors can switch profiles and modify shared application records.

Cloudflare assigns a new backend hostname on every tunnel start. The public Sites URL stays the same. After a restart, ask Codex to update the existing Site's `VOYAGE_BACKEND_URL` and redeploy its saved version. Do not create a new Site or regenerate the key unnecessarily.

## Check or stop

```powershell
node hosting/team-connection.cjs status
node hosting/team-connection.cjs stop
```

Stopping checks the recorded process ownership before stopping the gateway and tunnel. Oracle and an existing backend process are left running. The website stays deployed but reports that the host PC is unavailable. Keep the PC awake, online, and all required services running throughout the session. Temporary tunnels have no uptime guarantee and are intended for testing, not permanent hosting.

## Connection and source

Browser → Sites `/api/*` → protected HTTPS tunnel → local gateway → existing Express API → Oracle XE.

The tunnel key is added by the Sites server, never bundled in React. Direct tunnel requests without it are rejected. The gateway forwards only the API path and supported methods to a fixed loopback backend; it does not proxy arbitrary destinations. Sites forwards Oracle application errors and their codes unchanged, rejects cross-site write requests, and does not cache user data. Oracle remains the final authority for trigger rules.

The retained Vite frontend is published through the Sites source workflow. Hosting-specific source lives in the task's `sites/voyage-team-review` checkout; its `.openai/hosting.json` retains the Site ID. GitHub contains `frontend/worker/index.js`, `frontend/vite.sites.config.js` and the guide/test source for maintenance; regular local frontend development keeps its existing Vite configuration. Build the hosted variant with `npm run build:sites`. Configure production runtime secrets with Sites, not the manifest.

No backend `.env`, Oracle password, SQL spool, downloaded executable or local test runtime state is included in the published Site.

## Manual verification

Open `/team-testing` for a six-step checklist covering profiles, discovery, collections, reviews/saves, trip planning/dashboard, and date validation. Use clearly named temporary profiles and Planned trips. Completing a trip locks it through the installed triggers. Coordinate cleanup of profiles with the project owner because the application has no profile-delete endpoint.

Hosting verification uses read-only Oracle requests. Local proxy tests use simulated HTTP responses; their Oracle error fixtures verify transport behavior, not trigger execution. The prior approved live CRUD and trigger verification is documented in `backend/TESTING.md`.
