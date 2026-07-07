# RFC 0006: Single-Worker Production Deployment

| Field | Value |
|-------|-------|
| Status | Draft |
| Authors | @andriansandi |
| Created | 2026-07-06 |
| Updated | 2026-07-06 |
| Related | RFC 0005, ADR 0003 |

## Summary

KattoUI's production deployment serves both the Hono API (`apps/api`) and the TanStack Start SSR frontend (`apps/web`) from a **single Cloudflare Worker**. Static client assets are served via Workers Static Assets. This replaces the RFC 0005 topology of "Cloudflare Pages + separate Worker," which was only half-implemented in practice (only the API Worker was wired; the frontend was never deployed, so the production URL returned API JSON instead of the app). The apps remain separate in the monorepo (ADR 0003 unchanged) and local development remains split across two ports.

## Motivation

RFC 0005 prescribed Cloudflare Pages for the frontend and a Worker for the API. In practice:

- Only the root `wrangler.jsonc` (pointing at `apps/api/src/index.ts`) exists. Cloudflare Git integration detects it and deploys the **entire repo as one Worker = the API**.
- `apps/web` has no Wrangler config and no Cloudflare adapter in `vite.config.ts`. Its build output (`dist/{client,server}`) is never deployed.
- TanStack Start performs SSR (`dist/server/server.js` exists), so it cannot be served as pure static files on Pages without a runtime adapter.

Consequence: visiting the production URL returns the API's JSON root response, not the chat interface. The frontend is effectively undeployed.

Not solving this means KattoUI is unusable in production — the product (the chat UI) never reaches users.

## Terminology

| Term | Definition |
|------|------------|
| **Combined Worker** | A single Cloudflare Worker whose `fetch` handler routes between the Hono API and the TanStack Start SSR handler. |
| **Workers Static Assets** | Cloudflare binding that serves files from a directory (e.g. `dist/client`) before requests reach the Worker. |
| **SSR handler** | The `fetch`-shaped export produced by TanStack Start at `apps/web/dist/server/server.js`. |
| **Dev config** | `wrangler.dev.jsonc`, API-only, used for local `wrangler dev`. |
| **Prod config** | `wrangler.jsonc`, combined entry + assets binding, used for deploy and Git integration. |

## Proposal

### 1. Topology

```
            Internet
               │
        Cloudflare CDN
               │
     workers.dev / custom domain
               │
      ┌────────┴────────┐
      │  Combined Worker │
      │  (apps/api/src/  │
      │   worker.ts)     │
      └────────┬─────────┘
          │    │    │
   ASSETS │    │    │ API routes → Hono app
  (client)│    │    │ /health /providers
          │    │    │ /provider-configs /conversations
          ▼    │    ▼
     dist/client│  (everything else)
     JS/CSS/img │  → TanStack Start SSR fetch
                 │  / /chat/$id /settings/*
                 ▼
               D1 (bindings unchanged)
```

- Static assets (`/assets/*.js`, CSS, images) are served by the **Workers Static Assets** binding before the Worker's `fetch` runs (default `run_worker_first: false`).
- Known API path-prefixes are routed to the **Hono app**.
- All other paths are delegated to the **TanStack Start SSR handler** (`webServer.fetch(req, env, ctx)`).

### 2. Combined Worker entry

A new `apps/api/src/worker.ts` is the production `main`. It:

- Imports the configured Hono `app` from `./index.ts` (no duplication of routes).
- Imports the SSR default export from `../../web/dist/server/server.js` (a build artifact).
- Exports a default object with a `fetch` that routes by path-prefix to the API, else to SSR.

Routing rule (pseudocode):

```ts
const API_PREFIXES = ["/health", "/providers", "/provider-configs", "/conversations"];

export default {
  fetch(req, env, ctx) {
    const { pathname } = new URL(req.url);
    if (API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return app.fetch(req, env, ctx);
    }
    return webServer.fetch(req, env, ctx);
  },
};
```

The API's existing `app.get("/")` JSON handler remains for the dev (API-only) Worker; in production it is unreachable because `/` is routed to SSR.

### 3. Wrangler configuration

**`wrangler.jsonc` (root) — production:**

```jsonc
{
  "name": "katto-ui",
  "main": "apps/api/src/worker.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": "./apps/web/dist/client", "binding": "ASSETS" },
  "vars": { "ENVIRONMENT": "production", "GUEST_MODE": "true" },
  "d1_databases": [/* unchanged */]
}
```

**`wrangler.dev.jsonc` (root, new) — local API-only:**

```jsonc
{
  "name": "katto-ui",
  "main": "apps/api/src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": { "ENVIRONMENT": "development", "GUEST_MODE": "true" },
  "d1_databases": [/* unchanged */]
}
```

`apps/api/package.json` `dev`/`tail` scripts switch to `--config ../../wrangler.dev.jsonc`; `deploy` keeps `--config ../../wrangler.jsonc`.

### 4. Build & deploy pipeline

Cloudflare Workers Builds (Git integration):

- **Build command:** `pnpm install --frozen-lockfile && pnpm --filter @katto/web build`
- **Deploy command:** `npx wrangler deploy`
- Build order matters: the web must build first so `apps/web/dist/server/server.js` exists when Wrangler bundles `worker.ts`.

`packages/sdk` and `packages/design-system` have no build step (consumed as source by Vite), so `pnpm --filter @katto/web build` is sufficient.

### 5. Environment & CORS

- `VITE_API_URL` is a build-time var baked into the client bundle. For same-origin production, set `VITE_API_URL=""` in the Cloudflare build env. `apiUrl("/conversations")` then yields the relative `/conversations`, and the browser fetches same-origin.
- CORS on the API is a no-op for same-origin production (browsers skip preflight). It remains useful for local split dev (`localhost:5177` → `localhost:8791`). The origin list is updated to drop the unused `katto-ui.pages.dev` entry.
- Worker secrets (`CLERK_SECRET_KEY`, `ENCRYPTION_KEY`) are unchanged.

### 6. Local development (unchanged)

`pnpm dev` continues to run two processes:

- `pnpm dev:web` — Vite on `:5177` (HMR, no build needed).
- `pnpm dev:api` — `wrangler dev` with `wrangler.dev.jsonc` (API-only) on `:8791`.

The combined `worker.ts` is never used locally, so the web does not need to be pre-built for dev.

## Drawbacks

1. **Build coupling** — the web must build before the Worker bundle. The deploy pipeline is sequential, not parallel.
2. **Single deploy unit** — API and web ship together; the API can no longer be deployed independently of the frontend (a regression vs. ADR 0003's "independent deployment" positive consequence, accepted because in practice the two are coupled by shared SDK types anyway).
3. **Cross-app import in the bundle** — `worker.ts` imports `apps/web/dist/server/server.js`. Wrangler/esbuild resolves its dependencies (`react`, `@tanstack/react-router`) via pnpm's symlinked `node_modules` from the importing file's location. This must be verified with a `wrangler deploy --dry-run`.
4. **Two Wrangler configs to maintain** — `wrangler.jsonc` and `wrangler.dev.jsonc` duplicate bindings/vars. Drift risk; mitigated by keeping the dev config minimal.
5. **`server.js` uses Node APIs** (`node:async_hooks`, `node:stream`) — available via `nodejs_compat`, but ties the runtime to the compat flag (already enabled).

## Alternatives

| Alternative | Why not chosen |
|-------------|----------------|
| **Pages + Worker (RFC 0005 original)** | TanStack Start SSR needs a runtime; pure static Pages doesn't fit without an adapter that was never added. Also never actually set up — only the Worker half existed. |
| **Two Workers (web Worker + API Worker)** | Rejected by the maintainer in favor of a single deploy unit. Adds a second domain, CORS, and `VITE_API_URL` wiring. |
| **Move all API routes under `/api/*`** | Cleaner routing, but requires updating every `fetchApi` call and SSE stream URL in `apps/web`. Deferred to Future Work; the path-prefix routing in the Worker avoids collisions today. |
| **Hono as Pages Functions inside `apps/web`** | Collapses the two apps, contradicting ADR 0003. Rejected. |

## Adoption

1. Create `apps/api/src/worker.ts` (combined entry; route by API path-prefix, else SSR).
2. Update `wrangler.jsonc`: `main` → `worker.ts`, add `assets` binding to `./apps/web/dist/client`.
3. Create `wrangler.dev.jsonc` (API-only, `main` → `index.ts`, no assets).
4. Update `apps/api/package.json`: `dev`/`tail` → `--config ../../wrangler.dev.jsonc`.
5. Update CORS origin list in `apps/api/src/index.ts` (drop `pages.dev`).
6. Update `.env.example` note: `VITE_API_URL` empty for same-origin production.
7. Apply pending D1 migration to remote: `npx wrangler d1 migrations apply katto-ui-db --remote` (migration `0006_add_reasoning.sql`).
8. Configure Cloudflare Workers Builds: build command, deploy command, build env vars (`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL=""`), secrets (`CLERK_SECRET_KEY`, `ENCRYPTION_KEY`).
9. Verify: `pnpm typecheck`, `pnpm lint`, `wrangler deploy --dry-run` (bundle resolves), `wrangler dev` with dev config still serves `:8791`, deployed URL shows the chat UI.

## Future Work

- **Namespace API under `/api/*`** for cleaner routing and the option to split deployments again later.
- **AI Gateway binding** and remaining Cloudflare bindings per RFC 0005 (independent of this topology).
- **Preview deployments per branch** via Workers Builds.
- If independent API deploys become necessary, revisit the two-Worker topology with a shared domain via routes.
