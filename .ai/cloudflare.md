# AI Cloudflare Guide

## Deployment Topology

- `apps/web` deploys to Cloudflare Pages.
- `apps/api` deploys to Cloudflare Workers.
- Secrets (API keys, Clerk keys) must be configured via `wrangler secret` in production, not checked into the repo.

## Worker Best Practices

- Keep request handlers stateless and free of global mutable state.
- Use streaming response APIs for chat endpoints.
- Set appropriate `compatibility_date` and `compatibility_flags` in `wrangler.jsonc`.
- Use `crypto.randomUUID()` for IDs, not Node.js `crypto` unless needed.

## API

- Use Hono for routing and middleware.
- Protect routes with `requireAuth` middleware using Clerk session token verification.
- Return structured JSON errors with `error` field.

## Bindings Readiness

The API architecture is ready for D1, KV, R2, Durable Objects, AI Gateway, Vectorize, Queues, and Hyperdrive. Add bindings to `wrangler.jsonc` and to the `Env` type in `apps/api/src/types.ts` before using them.
