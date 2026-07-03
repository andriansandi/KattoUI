# Cloudflare Architecture

KattoUI is built for Cloudflare's edge. This document describes the target deployment topology, local development, and when to use each Cloudflare service.

---

## Deployment topology

### Frontend — Cloudflare Pages

`apps/web` is a TanStack Start application that builds to a static + serverless output. The recommended deployment target is **Cloudflare Pages**:

- Global CDN for static assets.
- Functions for edge-rendered routes if needed.
- Custom domains and preview deployments per branch.

### API — Cloudflare Workers

`apps/api` is a Hono application deployed as a **Cloudflare Worker**:

- Runs on Cloudflare's edge network close to users.
- Binds directly to D1, KV, R2, Durable Objects, Vectorize, Queues, and AI Gateway.
- Local development through Wrangler on `http://localhost:8791`.

---

## Bindings readiness

The following Cloudflare services are part of the architecture plan. Not all are bound in Phase 0.

| Service | Binding | Use case |
|---------|---------|----------|
| **D1** | `DB` | Relational data: users, workspaces, conversations, messages, API keys. |
| **KV** | `CACHE` | Short-lived caching, feature flags, and session-backed lookups. |
| **R2** | `BUCKET` | Uploaded files, generated images, and exported artifacts. |
| **Durable Objects** | `ROOMS` | Real-time chat rooms, presence, and agent state. |
| **AI Gateway** | `AI` | Unified routing, caching, and observability for AI providers. |
| **Vectorize** | `VECTOR_INDEX` | Embeddings and RAG indexing. |
| **Queues** | `QUEUE` | Async jobs: exports, batch ingestion, agent tasks. |
| **Hyperdrive** | `HYPERDRIVE` | Optional external database connection pooling if D1 is not sufficient. |

The current `wrangler.jsonc` is minimal and will gain bindings as services are adopted:

```json
{
  "name": "katto-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "ENVIRONMENT": "development"
  },
  "d1_databases": [],
  "kv_namespaces": [],
  "r2_buckets": [],
  "durable_objects": {
    "bindings": []
  }
}
```

---

## Local development

Local development uses Wrangler, which emulates the Workers runtime and bindings.

```bash
# Terminal 1 — API
cd apps/api
pnpm dev          # wrangler dev --port 8791

# Terminal 2 — Web
pnpm dev:web      # from the repo root; runs the frontend on port 5177
```

Or from the root:

```bash
pnpm dev
```

### Verify

```bash
curl http://localhost:8791/health
curl http://localhost:5177
```

### Environment

Create `.env` files from the shared `.env.example` and fill in your Clerk keys:

```bash
cp .env.example apps/web/.env
cp .env.example apps/api/.env
```

`apps/web/.env` needs `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL`.  
`apps/api/.env` needs `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

---

## Deployment

### Deploy the API worker

```bash
cd apps/api
pnpm deploy
```

This deploys the worker using the settings in `wrangler.jsonc`. Bindings must already exist in your Cloudflare account; missing bindings will cause runtime errors.

### Deploy the web frontend

The recommended path is to connect the Git repository to Cloudflare Pages:

1. Create a Pages project in the Cloudflare dashboard.
2. Connect the Git repository.
3. Set the build command to `pnpm build` or `pnpm --filter @katto/web build`.
4. Set the build output directory to `apps/web/dist`.
5. Add `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` as environment variables.

You can also deploy manually with Wrangler:

```bash
cd apps/web
pnpm build
wrangler pages deploy dist
```

### Production environment variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Pages | Clerk public key for the web app. |
| `VITE_API_URL` | Pages | URL of the deployed API worker. |
| `CLERK_PUBLISHABLE_KEY` | Worker | Clerk public key (used if needed on the server). |
| `CLERK_SECRET_KEY` | Worker | Clerk secret for validating auth tokens. |

---

## Security on Cloudflare

- Use **Cloudflare Access** if you need to restrict who can reach preview deployments.
- Enable **Turnstile** on public forms before release.
- Configure a **WAF** rule to rate-limit `/chat` and `/models` endpoints.
- Store provider API keys in **Workers Secrets** (`wrangler secret put`), never in `vars`.
- Use **AI Gateway** to centralize provider credentials, logging, caching, and retries.

See [SECURITY.md](./SECURITY.md) for the full security checklist.
