# Sub Stream frontend

Standalone React + Vite frontend for Sub Stream. Custom AQUA light interface, real backend calls, no demo streams. No Next.js server, Cloudflare Worker, or ChatGPT runtime is required.

**Production URL:** https://taylorchappell.github.io/SubStreamFrontend/

## Deploy on GitHub Pages

The workflow in `.github/workflows/pages.yml` installs the locked dependencies, runs tests, builds the app, checks the static artifact, and deploys `dist/` whenever `main` changes. You can rerun it from Actions → Build and deploy Sub Stream → Run workflow.

In Settings → Pages → Build and deployment, **Source must be GitHub Actions**. Do not select a source branch/Jekyll build. The workflow publishes only built browser files, not this README.

The default asset base is `/SubStreamFrontend/`. Navigation uses hash routes, for example:

- `https://taylorchappell.github.io/SubStreamFrontend/#/studio`
- `https://taylorchappell.github.io/SubStreamFrontend/#/following`
- `https://taylorchappell.github.io/SubStreamFrontend/#/stream/aqua-coin`

These URLs can be copied, refreshed, opened in a new tab, and navigated with Back/Forward without server rewrites. A generated `404.html` also recovers legacy clean links where GitHub serves its custom error document. Use hash links for sharing because they return HTTP 200 directly.

## Connect the backend

Deploy [SubStreamBackend](https://github.com/TaylorChappell/SubStreamBackend) using its [full setup guide](https://github.com/TaylorChappell/SubStreamBackend/blob/main/DEPLOYMENT.md).

In this frontend repository, open **Settings → Secrets and variables → Actions → Variables**. Add a **repository variable**, not a secret:

```text
API_BASE_URL=https://YOUR_BACKEND_DOMAIN
```

Use the origin only, with no `/api`, query string, password, or API key. Rerun the deployment workflow after changing this variable. Variable changes alone do not trigger a build.

Alternatively, set `apiUrl` in `public/config.json` and commit it. The Actions variable takes precedence. The build emits `dist/config.json` containing only that public origin; the browser fetches it from the correct repository subpath. Blank means the backend is not connected, and the interface explicitly says so.

For this GitHub Pages deployment, set these **backend** variables:

```text
AUTH_DOMAIN=taylorchappell.github.io
CORS_ORIGINS=https://taylorchappell.github.io
CLOUDFLARE_ALLOWED_ORIGINS=taylorchappell.github.io
```

CORS uses the origin **without /SubStreamFrontend/**. Cloudflare playback restrictions use the hostname **without https:// or a path**. Existing Cloudflare inputs also need their allowed origins updated if you previously used a different frontend host.

Wallet signatures, authentication, holder checks, API mutations and chat WebSockets go directly to the backend. GitHub Pages does not run the API. Keep Cloudflare, Helius, database, JWT and encryption secrets only on the backend. Do not place any of them in `public/`, frontend environment variables, or GitHub commits.

If retaining the previous hosted Site alongside Pages, allow both exact frontend origins on the backend. This repository now targets GitHub Pages; the older hosted Site is a separate deployment and is not changed by this workflow.

## Local development

Requirements: Node **22.18+**, pnpm **11.19.0**.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Open `http://localhost:5173/SubStreamFrontend/`. The development server serves public configuration from `.env`; restart it after environment changes. Start the backend at `http://localhost:8080` and allow `http://localhost:5173` in backend CORS. The backend's development `AUTH_DOMAIN` can be `localhost`.

```bash
pnpm test
pnpm build
pnpm check:build
pnpm preview
```

The preview serves the actual built files at `http://localhost:4173/SubStreamFrontend/`. Build again after changing `.env`. You can deploy `dist/` to any static host. For a root/custom-domain deployment, set `PAGES_BASE_PATH=/` at build time and update backend origins.

## What is implemented

- Live Explore, category/search filters, Following and schedules backed by the API
- Wallet Standard discovery and signed-message sessions
- Live Cloudflare player and explicit offline/unavailable states
- Holder chat over WebSockets, reconnect, moderation and reports
- Creator ownership checks, channels, encrypted broadcast-key access/rotation, enable/end controls
- Announcements, schedules, moderator and wallet-ban management
- Calendar downloads with correct Pages stream links

Tips, paid subscriptions, and clip browsing are not part of this release. Calendar reminders require importing the downloaded event; they are not browser push notifications.

## Verification and launch acceptance

Automated tests cover routing, config validation, API error handling/auth headers, WebSocket origins, and the generated static artifact. The backend has separate integration tests.

Before public launch, complete one real creator-wallet login, channel creation, OBS broadcast/playback, holder/non-holder chat check, follow/unfollow, schedule/calendar import, and moderation cycle against your deployed backend. Provider keys and a backend URL are not included in this repository. A successful frontend build is not proof that an unconfigured backend is live.
