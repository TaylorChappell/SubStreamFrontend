# Sub Stream Frontend

The live community layer for coins launched on AQUA. Sub Stream gives creators a dedicated broadcast channel and gives holders a real-time place to watch, chat, and follow updates.

## Product surface

- Live discovery feed for active AQUA creators
- Cloudflare Stream player support with an interactive preview fallback
- Solana wallet sign-in through Phantom or MetaMask
- Holder-only live chat backed by wallet token-balance checks
- Coin follows, upcoming schedules, and device reminders
- Creator studio for channel settings, OBS credentials, key rotation, announcements, schedules, and ending a stream
- Responsive navigation and complete mobile layouts
- WebMCP actions for opening a channel and saving stream reminders

The interface uses demo content when `NEXT_PUBLIC_API_URL` is not set, so the full product can be reviewed without infrastructure. Once an API origin is configured, authenticated actions and public data use the backend.

## Local development

Requirements: Node.js 22.13 or newer and pnpm 11.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open the URL printed by the development server.

## Environment

```text
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Use the public HTTPS origin of the Sub Stream backend in production. Do not add Solana RPC credentials, Cloudflare API tokens, or broadcast keys to frontend environment variables.

## Quality checks

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

## Architecture

This repository is the UI only. The separate `SubStreamBackend` service owns wallet challenge verification, AQUA caching, direct Solana RPC checks, Cloudflare live inputs, PostgreSQL, Redis, and WebSocket chat.

SUB-based subscriptions, tips, and clips are intentionally reserved for a later product phase. V1 focuses on a reliable creator broadcast workflow and holder community experience.
