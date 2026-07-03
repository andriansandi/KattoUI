# AI Architecture Guide

Read before making structural changes.

## Where to look first

1. `ARCHITECTURE.md` for the current system overview.
2. `rfcs/` and `adr/` for recorded decisions.
3. `AGENTS.md` for project context and key principles.

## Monorepo boundaries

- `apps/web` — TanStack Start frontend. Owns routes, layouts, components, and client-side state.
- `apps/api` — Cloudflare Worker + Hono API. Owns HTTP routes, auth middleware, provider proxies.
- `packages/sdk` — TypeScript contracts only. No runtime dependencies.
- `packages/design-system` — Theme tokens and CSS variables. No React components.
- `packages/config` — Shared Biome config.
- `packages/tsconfig` — Shared TypeScript configs.

## Rules

- Core app code must not import provider-specific SDKs (OpenAI, Anthropic, etc.).
- Core app code must not import plugin implementations directly.
- Provider details live in adapters behind `packages/sdk` `ProviderAdapter`.
- Plugin details live behind `packages/sdk` `PluginManifest` / `PluginContext`.
- UI components must not depend on auth implementation; use Clerk hooks locally but isolate abstraction-ready boundaries.
