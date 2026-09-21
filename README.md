# Sub Stream frontend

A custom AQUA-aligned streaming application: pale blue surfaces, white cards and blue controls. The pages are built for Sub Stream, not a purchased page template. React primitives and the Sites/Vinext hosting runtime provide infrastructure.

## Backend setup

Read the complete [backend deployment guide](https://github.com/TaylorChappell/SubStreamBackend/blob/main/DEPLOYMENT.md) first.

The only frontend configuration is the **public** backend origin:

```text
API_BASE_URL=https://your-sub-stream-api.example
```

The frontend reads this at runtime through `/api/config`. Set it in the hosted Site's environment and redeploy. No Cloudflare, Helius, database or encryption keys belong here. The backend must allow the exact frontend origin in CORS and accept its WebSocket Origin.

Until the backend is deployed/configured, pages show honest connection errors. There are no sample live streams, fake transactions, invented chart trends or local-success mutation fallbacks.

## Local development

Node 22.18+ and pnpm 11.19:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars
pnpm dev
```

The local Worker reads `.dev.vars` with `API_BASE_URL=http://localhost:8080`. Open the URL printed by the command (normally localhost:5173). Start the companion backend separately; add this origin to backend CORS. The optional legacy `NEXT_PUBLIC_API_URL` fallback is a public origin, never a secret.

## Checks

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Build output is a Cloudflare Worker plus browser assets. This project is not a GitHub Pages/static export or a conventional `next start` Railway service. Existing deployment uses Sites. The repository is source storage; pushing GitHub alone does not update the Site.

## Functional surfaces

- Live discovery with real search/categories and periodic refresh
- Followed channels persisted by the API, with explicit error/empty states
- Stream player/offline state, cached market history and creator announcements
- Public read-only chat polling, holder-authorized WebSockets, reconnect and access rechecks
- Wallet Standard discovery, Solana signature login, session validation and account-change handling
- Creator coin verification, channel editing, broadcast key retrieval/rotation, end/enable controls
- Schedules, .ics calendar downloads, announcements, bans, moderators, message removal and reports

Calendar alerts are delivered by the user's calendar after importing the file, not by a nonexistent push service. Market data is cached, not a fake real-time trade feed. Tips/subscriptions/clips remain outside this release.

Production acceptance still requires an actual OBS broadcast, a creator wallet, a holder/non-holder pair, provider keys and deployed PostgreSQL/Redis. Automated tests simulate network responses; they do not claim live provider verification.
