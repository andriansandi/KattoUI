# RFC 0001: KattoUI Monorepo Architecture

| Field | Value |
|-------|-------|
| Status | Draft |
| Authors | KattoUI Core Team |
| Created | 2026-07-02 |
| Updated | 2026-07-02 |
| Related | ADR 0001, ADR 0003, RFC 0002, RFC 0003, RFC 0004, RFC 0005 |

## Summary

This RFC defines the overall technical architecture for KattoUI: a Cloudflare-first, self-hostable AI chat interface. It describes the monorepo layout, the boundary between the frontend application and the API worker, the contracts that isolate providers/plugins/themes from the application core, and the rationale behind the selected technology stack.

## Motivation

KattoUI must satisfy four competing goals simultaneously:

1. **Professional UX** — fast, keyboard-first, minimal, enterprise-ready UI.
2. **Self-hostability** — a determined user can run the entire system on their own Cloudflare account.
3. **Provider and model agnosticism** — support multiple LLM providers without hard-coded provider logic in the UI or API.
4. **Long-term extensibility** — plugins, themes, commands, and settings must be installable without restructuring the monorepo.

A clean architecture with explicit contracts is required so that application code never depends directly on provider SDKs, plugin internals, or theme implementation details.

## Terminology

| Term | Definition |
|------|------------|
| **Core** | Application code in `apps/web` and `apps/api` that implements chat, settings, auth, and routing. Core is provider/plugin/theme agnostic. |
| **SDK** | `packages/sdk` containing TypeScript contracts, registries, and shared primitives. |
| **Provider Adapter** | An implementation of the `ProviderAdapter` interface that translates KattoUI chat requests to a specific LLM backend (OpenAI, Anthropic, Gemini, Cloudflare Workers AI, Ollama, etc.). |
| **Plugin** | A runtime-registered extension that contributes pages, commands, sidebar items, providers, themes, settings, or MCP servers through the plugin SDK. |
| **Theme** | A declaration of colors, typography, radius, spacing, icons, animations, and decorations expressed as CSS variables and a JSON token contract. |
| **Registry** | A runtime or build-time collection of adapters, plugins, themes, commands, shortcuts, or feature flags. |

## Proposal

### 1. Monorepo Layout

```
/apps
  /web           TanStack Start frontend (port 5177)
  /api           Cloudflare Worker + Hono API (port 8791)
/packages
  /sdk           Contracts and registries (providers, plugins, themes, auth, flags)
  /design-system Theme tokens, CSS variables, shared UI primitives
  /config        Shared tooling config (Biome, Vitest, TypeScript base, etc.)
  /tsconfig      Shared tsconfig packages
```

- Each app and package has a single, well-defined responsibility.
- `apps/web` imports `packages/sdk` and `packages/design-system` but never imports provider SDKs directly.
- `apps/api` imports `packages/sdk` but provider-specific SDKs are loaded only inside provider adapter packages.

### 2. Dependency Rules

```
apps/web  ──┬──► packages/sdk
            └──► packages/design-system

apps/api  ──┬──► packages/sdk
            └──► adapters (future packages implementing SDK contracts)

packages/design-system ──► packages/sdk (token types only)
packages/config          (no runtime code)
packages/tsconfig        (no runtime code)
```

- Cycles between packages are forbidden.
- `packages/sdk` must not depend on React, a UI framework, or any provider SDK.
- `packages/design-system` may depend on React but not on application business logic.

### 3. Frontend Architecture (`apps/web`)

- **Framework**: TanStack Start on React 19 with TanStack Router for file-based routing.
- **Server state**: TanStack Query handles caching, invalidation, background updates, and optimistic mutations.
- **UI state**: Zustand for ephemeral UI state (command palette, sidebar, modal stacks, theme selection).
- **Auth**: Clerk React (`@clerk/clerk-react`) for authentication; appearance synced with the active theme.
- **Styling**: Tailwind CSS v4 with CSS-first theming; all colors reference CSS variables produced by `packages/design-system`.
- **Components**: shadcn/ui primitives as a foundation, restyled against the design-system token contract.
- **Motion**: Motion (Framer Motion successor) for purposeful, hardware-accelerated transitions.
- **Icons**: Lucide icons only; themes may map icon names to alternative icon sets through the icon registry.

### 4. API Architecture (`apps/api`)

- **Runtime**: Cloudflare Worker.
- **Framework**: Hono for routing, middleware, validation, and streaming responses.
- **Auth**: `@hono/clerk-auth` middleware validating Clerk sessions.
- **Provider routing**: All inference requests go through a provider-agnostic orchestrator that loads the active `ProviderAdapter` from a registry.
- **Streaming**: Chat completions are streamed to the frontend using HTTP `text/event-stream` or Hono streaming primitives, transformed by the adapter into a normalized chunk format.
- **Storage readiness**: Bindings for D1, KV, R2, Durable Objects, AI Gateway, Vectorize, Queues, and Hyperdrive are configured in `wrangler.jsonc` even if not all are used on day one.

### 5. Abstraction Boundaries

#### 5.1 Provider Abstraction

The core never calls OpenAI, Anthropic, Gemini, or Cloudflare AI directly. It calls a registry of `ProviderAdapter` implementations returned by the SDK contract. See RFC 0003 for the full interface.

High-level flow:

```
UI Request
   │
   ▼
apps/api orchestrator
   │
   ▼
ProviderRegistry.resolve(providerId)
   │
   ▼
ProviderAdapter.streamChat(request)
   │
   ▼
normalized SSE chunks
```

#### 5.2 Plugin Abstraction

Plugins register capabilities through a manifest. The core queries the `PluginRegistry` to discover sidebar items, commands, settings panels, providers, themes, and MCP tools. See RFC 0004.

Core responsibilities:

- Render registered routes and sidebar items.
- Execute commands through the command palette.
- Apply theme tokens supplied by plugins.
- Load providers supplied by plugins.
- Validate plugin permissions before activation.

Plugin responsibilities:

- Provide a manifest conforming to the SDK contract.
- Implement declared capabilities without depending on core internals.

#### 5.3 Theme Abstraction

Themes are data, not code that changes layouts. A theme is a JSON object plus an optional CSS layer. The design system maps token values to CSS custom properties. See RFC 0002.

Core responsibilities:

- Persist the active theme ID.
- Apply the theme's CSS layer to the document root.
- Pass a Clerk appearance object derived from the active theme.

Theme responsibilities:

- Declare values for every token in the token contract.
- Provide light/dark/base variants if applicable.
- Avoid layout, component, or behavior opinions.

### 6. Technology Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript 5.x | Strict static typing across monorepo. |
| Runtime (API) | Cloudflare Worker | Edge-first, global by default, binding ecosystem matches product goals. |
| Frontend framework | TanStack Start | Modern full-stack React router with excellent type-safe routing, server functions, and streaming support. |
| API framework | Hono | Lightweight, fast, middleware-rich, first-class Cloudflare Workers support. |
| Styling | Tailwind CSS v4 | CSS-first configuration, excellent performance, var-based theming. |
| UI primitives | shadcn/ui | Copy-paste primitives that can be restyled against our token contract. |
| Auth | Clerk | Offloads auth UI, session security, and organization features. Abstracted for future self-hosted replacement. |
| State (UI) | Zustand | Minimal boilerplate, TypeScript friendly, avoids prop drilling. |
| State (server) | TanStack Query | Robust caching, background sync, optimistic updates. |
| Validation | Zod | Shared schema language for frontend forms and API payloads. |
| Icons | Lucide | Consistent, minimal, tree-shakeable. |
| Package manager | pnpm | Worksapce support, strict dependency control, fast install. |
| Linting/Formatting | Biome | Fast unified formatter and linter. |
| Testing | Vitest + Playwright | Unit and integration tests, end-to-end tests. |

### 7. Local Development

Running `pnpm dev` starts both processes in parallel:

- `pnpm dev:web` → `http://localhost:5177`
- `pnpm dev:api` → `http://localhost:8791`

The frontend proxies API requests to `localhost:8791` or calls it directly depending on environment configuration. Both processes must be running before feature work begins.

### 8. Build and Deployment

- `apps/web` is built as a static or server-rendered output deployable to Cloudflare Pages.
- `apps/api` is bundled with Wrangler and deployed as a Cloudflare Worker.
- Shared packages are compiled or are pure TypeScript consumed via `exports` maps and TypeScript project references.
- Environment-specific values (Clerk keys, provider API keys, binding names) are read from `.env`/`.dev.vars` locally and from Cloudflare secrets in production.

## Drawbacks

1. Running two separate local servers requires more orchestration than a single Vite dev server.
2. Strict abstraction boundaries add initial boilerplate compared to importing OpenAI SDK directly in `apps/web`.
3. TanStack Start is newer than Next.js; the ecosystem and migration guides are smaller.
4. Clerk abstraction adds a layer that must be maintained if we add a self-hosted auth backend later.

## Alternatives

| Alternative | Why not chosen |
|-------------|----------------|
| Next.js instead of TanStack Start | Next.js couples routing and rendering tightly to its framework conventions; TanStack Start gives cleaner separation of router, server functions, and streaming. |
| tRPC instead of REST/Hono | tRPC is excellent but couples frontend and backend types across packages; a contract-first REST + Zod approach keeps `packages/sdk` as the single source of truth. |
| Turborepo/Nx instead of pnpm workspaces | pnpm workspaces plus simple npm scripts are sufficient for the initial scope. See ADR 0001. |
| Direct LLM SDK calls in frontend | Violates provider abstraction, exposes API keys, and complicates future server-side caching/ gateway routing. |

## Adoption

1. Merge RFC and create directory structure.
2. Implement `packages/sdk` with provider, plugin, theme, command, shortcut, and feature-flag registries.
3. Implement `packages/design-system` base tokens and `katto` default theme.
4. Scaffold `apps/web` and `apps/api` against SDK contracts.
5. Add CI checks enforcing dependency rules (no core→provider SDK imports, no package cycles).

## Future Work

- Scripted migration path from single-runtime dev to production Cloudflare Pages + Worker.
- CLI tooling for scaffolding new provider adapters and plugins.
- End-to-end type generation from SDK contracts to OpenAPI/TanStack Query.
