# RFC 0005: KattoUI Cloudflare Runtime

| Field | Value |
|-------|-------|
| Status | Partially superseded — deployment topology (§1, §2, §6) replaced by RFC 0006. Bindings (§3), local dev (§4), env strategy (§5), observability (§7), and secrets (§8) remain current. |
| Authors | KattoUI Core Team |
| Created | 2026-07-02 |
| Updated | 2026-07-06 |
| Related | RFC 0001, ADR 0003, RFC 0006 |

## Summary

This RFC describes how KattoUI is deployed to and runs on Cloudflare. The frontend is served by Cloudflare Pages and the API by a Cloudflare Worker. The Worker is configured with bindings for D1, KV, R2, Durable Objects, AI Gateway, Vectorize, Queues, and Hyperdrive so that the architecture is ready for persistence, caching, vector search, background jobs, and external databases as features are added. Local development uses Wrangler with bindings emulated or provisioned locally.

## Motivation

KattoUI is explicitly "Cloudflare-first" and self-hostable. Every runtime, storage, and deployment choice must therefore map cleanly to Cloudflare primitives, be reproducible in local development, and avoid services that cannot be self-hosted on a single Cloudflare account.

## Terminology

| Term | Definition |
|------|------------|
| **Pages** | Cloudflare Pages project serving the built frontend assets. |
| **Worker** | Cloudflare Workers script running the Hono API. |
| **Binding** | A Cloudflare platform capability attached to a Worker at runtime. |
| **Wrangler** | Cloudflare CLI for local development and deployment. |
| **dev.vars** | Local environment overrides for Wrangler dev server. |
| **Secrets** | Encrypted values uploaded to Cloudflare and injected into `env`. |

## Proposal

### 1. Deployment Topology

```
┌─────────────────────────────────────┐
│           Internet                  │
└─────────────┬───────────────────────┘
              │
      ┌───────┴────────┐
      │ Cloudflare CDN │
      └───────┬────────┘
              │
    ┌─────────┴──────────┐
    │  workers.dev /     │
    │  custom domain     │
    └─────────┬──────────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
 Cloudflare      Cloudflare
 Pages           Worker (Hono)
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
   D1/KV/R2    AI Gateway   Durable Objects
   Vectorize   Queues       Hyperdrive
```

The frontend calls the API at a configured origin (`VITE_API_URL` locally, same origin via Pages Functions routing in production if desired, or a dedicated API subdomain).

### 2. Apps and Wrangler Configuration

Each app has its own Wrangler configuration:

- `apps/web/wrangler.jsonc` — Pages project config.
- `apps/api/wrangler.jsonc` — Worker config with bindings.

Both reference `packages/*` through TypeScript project references or pre-build steps.

### 3. Bindings

The following bindings are declared in `apps/api/wrangler.jsonc`. Not all are used on day one, but declaring them ensures the architecture can grow without config restructuring.

| Binding | Purpose |
|---------|---------|
| **D1** | Relational persistence: users, conversations, messages, plugin metadata, provider settings. |
| **KV** | Caching: model lists, provider health results, feature flags, session metadata. |
| **R2** | Object storage: exported conversations, generated artifacts, plugin assets. |
| **Durable Objects** | Stateful coordination: active chat sessions, real-time collaboration rooms, rate-limit counters. |
| **AI Gateway** | Unified routing, caching, retries, and observability for LLM provider calls. |
| **Vectorize** | Semantic search over chat history, documents, or knowledge bases. |
| **Queues** | Background jobs: long exports, indexing, notification delivery, plugin event processing. |
| **Hyperdrive** | Accelerated connection pooling to external Postgres databases if self-hosted persistence is preferred over D1. |

### 4. Local Development

The `pnpm dev` command runs the frontend and the API Worker in parallel:

```bash
pnpm dev:web   # TanStack Start dev server — http://localhost:5177
pnpm dev:api   # wrangler dev — http://localhost:8791
```

Wrangler dev emulates bindings locally:

- `--persist-to` stores D1, KV, and R2 state across dev sessions.
- Local AI Gateway, Vectorize, Queues, and Durable Objects are provided by Wrangler's local mode with reasonable fidelity.
- Hyperdrive requires a remote connection or is mocked locally.

API keys and secrets are read from `apps/api/.dev.vars` and are never committed.

### 5. Environment Strategy

| Environment | Purpose | Domains |
|-------------|---------|---------|
| Local | Developer iteration | localhost:5177 / localhost:8791 |
| Preview | Branch previews | Pages preview URLs |
| Staging | Integration testing before production | staging.* / workers.dev |
| Production | Live users | custom domain |

Environment variables:

- `VITE_CLERK_PUBLISHABLE_KEY` — public Clerk key consumed by `apps/web`.
- `CLERK_SECRET_KEY` — secret consumed by `apps/api`.
- Provider API keys — stored as Cloudflare secrets per environment.
- `VITE_API_URL` — API origin for the current environment.

### 6. Deployment Pipeline

1. `pnpm lint` and `pnpm typecheck` run in CI.
2. `pnpm test` and `pnpm test:e2e` run against local Wrangler bindings.
3. `apps/web` builds static/Pages output.
4. `apps/api` builds Worker bundle via Wrangler.
5. Deploy Pages and Worker to the target environment using Wrangler in CI.
6. Run smoke tests against the deployed environment.

### 7. Observability

- Use Cloudflare Workers Logs and Tail for runtime logs.
- Use AI Gateway analytics for provider latency, tokens, and error rates.
- Use Sentry or a similar service for error tracking if desired; prefer Cloudflare-native logs initially.
- Application code never calls `console.log`; it uses the logging abstraction from `packages/sdk` which writes structured logs compatible with Workers Logs.

### 8. Secrets Management

- All secrets are created with `wrangler secret put <name> --env <env>`.
- Local secrets live in `.dev.vars` and are excluded from version control.
- Rotating a secret is a single Wrangler command; no deployment of source code is required.

## Drawbacks

1. Running two Wrangler/Pages dev processes requires orchestration.
2. Some bindings (Vectorize, Hyperdrive) have limited local fidelity and require remote resources for realistic testing.
3. Initial D1 schema migrations must be authored and run per environment.

## Alternatives

| Alternative | Why not chosen |
|-------------|----------------|
| Docker Compose for local dev | Cloudflare Workers runtime and bindings cannot be fully reproduced in Docker; Wrangler local mode is the official path. |
| Single Pages Function as API | Pages Functions are Workers, but a separate `apps/api` Worker keeps routing, bindings, and deployment independent. See ADR 0003. |
| Traditional server (VPS) deployment | Violates the Cloudflare-first, edge-native goal. |

## Adoption

1. Create `wrangler.jsonc` files for `apps/web` and `apps/api`.
2. Add `.dev.vars.example` and document secret setup.
3. Configure CI GitHub Actions for lint, typecheck, test, and deploy.
4. Create D1 migrations for core schemas (users, conversations, messages, settings).
5. Verify local binding emulation with a `/health` endpoint that reads KV and D1.
