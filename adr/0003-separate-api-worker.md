# ADR 0003: Separate API Worker and Frontend Dev Ports

| Field | Value |
|-------|-------|
| Title | Run Frontend and API on Separate Local Ports and in Separate Apps |
| Date | 2026-07-02 |
| Status | Accepted |

## Context

KattoUI has two distinct runtime concerns: a user-facing frontend and an API backend that routes to LLM providers and accesses Cloudflare bindings. Two layout options were considered:

1. A single `apps/web` app where API routes are implemented as Pages Functions or server functions inside TanStack Start.
2. Two independent apps: `apps/web` for the frontend and `apps/api` for the API Worker.

## Decision

We will use **two independent apps**:

- `apps/web` — TanStack Start frontend, local dev port `5177`.
- `apps/api` — Cloudflare Worker + Hono API, local dev port `8791`.

_Local development runs both processes in parallel via `pnpm dev`. The frontend is configured to call `localhost:8791` for API requests._

## Consequences

### Positive

- The API Worker owns its own `wrangler.jsonc`, bindings, and deployment lifecycle independent of Pages.
- Provider SDKs, secrets, and binding access never leak into the frontend build.
- The API can be deployed, scaled, and versioned independently.
- It is easier to run integration tests against the API without spinning up the full frontend dev server.

### Negative / Trade-offs

- Local development requires orchestrating two dev servers instead of one.
- CORS must be configured for local development, or the frontend must proxy requests through its dev server.
- Slightly more configuration than a single-app setup.

### Related Decisions

- RFC 0001 — Monorepo architecture.
- RFC 0005 — Cloudflare runtime deployment topology.
