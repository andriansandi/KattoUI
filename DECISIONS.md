# Architecture Decision Records

This file records significant decisions made during the design of KattoUI. Each entry includes the decision, date, context, and current status.

---

## ADR-001: pnpm workspaces as the monorepo tool

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Use pnpm workspaces as the monorepo primitive. Do not introduce Turborevo, Nx, or Lage in Phase 0.

### Context
We need a monorepo that can hold two apps and several shared packages. The surface is small enough that a task runner is optional today. pnpm workspaces give us fast installs, strict hoisting, and workspace protocol dependencies.

### Consequences
- Simpler initial setup with fewer moving parts.
- We may adopt Turborevo later if build orchestration becomes a bottleneck.
- Root scripts (`pnpm dev`, `pnpm build`) must manually coordinate packages for now.

---

## ADR-002: Two apps (web + api) instead of a single full-stack app

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Split the project into `apps/web` (TanStack Start frontend) and `apps/api` (Cloudflare Worker + Hono API).

### Context
KattoUI is Cloudflare-first. The frontend belongs on Cloudflare Pages for fast global delivery, while the API belongs on Cloudflare Workers for edge compute and bindings (D1, KV, R2, Durable Objects, AI Gateway). A single app would force a single deployment target and limit our ability to use Worker-specific bindings directly.

### Consequences
- Independent deploys and scaling.
- Slightly more local orchestration (`pnpm dev` runs two processes).
- CORS must be correctly configured during development.

---

## ADR-003: Clerk for authentication

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Use Clerk for authentication and session management.

### Context
We need secure, hosted auth quickly. Clerk gives us sign-in, sign-up, sessions, organizations, and JWT verification with minimal custom code. The auth layer is abstracted behind `AuthAdapter` in `@katto/sdk` so we are not permanently locked in.

### Consequences
- Web uses `VITE_CLERK_PUBLISHABLE_KEY`.
- API uses `CLERK_SECRET_KEY` via `@clerk/backend`.
- Future migrations require replacing only the adapter implementations.

---

## ADR-004: Hono for the Cloudflare Worker API

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Use Hono as the HTTP framework inside `apps/api`.

### Context
Hono is tiny, typed, and purpose-built for edge runtimes including Cloudflare Workers. Its middleware model (CORS, auth, logging) keeps the router clean and testable.

### Consequences
- Minimal cold-start overhead.
- Native access to Cloudflare bindings in `c.env`.
- Team must learn Hono conventions rather than Express-style middleware.

---

## ADR-005: Tailwind CSS v4

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Adopt Tailwind CSS v4 with the CSS-first configuration model.

### Context
Tailwind v4 removes the need for a large JavaScript config file. It fits naturally with our theme engine because tokens can be expressed as CSS custom properties imported from the design system package. We use shadcn/ui patterns without copying the entire shadcn registry.

### Consequences
- Theme tokens are CSS variables generated from `ThemeDefinition`.
- `@tailwindcss/vite` plugin handles bundling.
- Upgrades from v3 habits are mostly transparent but require attention to v4 syntax.

---

## ADR-006: Zustand for client state, TanStack Query for server state

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Use TanStack Query for server state and Zustand for global client UI state.

### Context
Mixing server and client state in one store leads to stale caches and awkward invalidation. TanStack Query gives us caching, deduplication, streaming, and background refetching. Zustand is perfect for lightweight UI-only state such as theme, command palette open/closed, and sidebar collapse.

### Consequences
- Clear mental model: Query owns the server, Zustand owns the browser UI.
- Forms use TanStack Form validated by Zod.

---

## ADR-007: No SSR for the primary chat UI

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Build the chat UI as a client-rendered SPA experience on top of TanStack Start. Do not rely on SSR for chat routes.

### Context
Streaming AI responses, abort signals, and real-time updates are simpler when the client owns the lifecycle. TanStack Start still lets us add SSG for marketing routes later without rewriting the app.

### Consequences
- Faster iteration on chat interactions.
- Initial load of the chat app can be cached as a static shell.
- SEO is not a priority for authenticated chat views.

---

## ADR-008: SDK package owns all contracts

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Put all cross-cutting contracts (providers, plugins, themes, commands, keyboard, feature flags, logging, auth, telemetry) into `packages/sdk`.

### Context
Without a shared contract layer, each package silently invents its own types. Centralizing contracts in `packages/sdk` makes the surface area explicit and makes it easy for plugins and providers to depend on exactly one package.

### Consequences
- `@katto/sdk` is a near-universal dependency.
- Changes to contracts require careful versioning once we publish packages.

---

## ADR-009: Abstractions must be paid for

**Date:** 2025-07-02  
**Status:** Accepted

### Decision
Every abstraction must solve a concrete problem today. Do not add generic layers "just in case."

### Context
Premature abstraction is the fastest way to slow a project down. Provider adapter, plugin SDK, theme engine, command palette, and auth abstraction each solve a real problem in Phase 0–4. Additional abstractions must be justified by an issue or RFC.

### Consequences
- Smaller, easier-to-understand codebase.
- New abstractions require a short RFC or ADR update.

---

## ADR-010: Plugins declare permissions; host enforces them

**Date:** 2025-07-02  
**Status:** Proposed

### Decision
Plugins ship a manifest that lists required permissions. The host evaluates the manifest before activation and refuses permissions it does not want to grant.

### Context
Third-party code will eventually run inside KattoUI. A permission model lets users understand what a plugin can do before enabling it. The permission surface maps to concrete plugin-context methods.

### Consequences
- Plugin UI must show a permission prompt.
- Host must validate every plugin action against granted permissions.
- Sandboxing strategy will be defined before Phase 7 ships.
