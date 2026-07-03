# KattoUI — Agent Guide

The Open Source AI Workspace built for Cloudflare.

## Project Context

KattoUI is a Cloudflare-first, self-hostable AI chat interface. It is not an Open WebUI clone. The design target is professional, fast, and extensible — think Linear, Vercel, Raycast, GitHub, ChatGPT, Claude. The "cat" inspiration lives only in branding and the default `katto` theme; the UI itself must remain clean, minimal, and enterprise-ready.

This repository is structured as a **pnpm workspaces monorepo** that can evolve into a larger monorepo without major restructuring.

## Tech Stack

- React 19 + TypeScript
- TanStack Start, TanStack Router, TanStack Query, TanStack Form
- Tailwind CSS v4 + shadcn/ui
- Motion (Framer Motion successor)
- Lucide Icons
- Zustand
- Zod
- Biome
- Vitest + Playwright
- Clerk (authentication)

Cloudflare:

- Workers + Wrangler
- Hono (API framework)
- D1, KV, R2, Durable Objects, AI Gateway, Vectorize, Queues, Hyperdrive (architecture-ready)

## Dev Environment

**Always start the dev servers before working on code.**

```bash
pnpm install
pnpm dev
```

This runs two processes in parallel:

- Frontend: `http://localhost:5177` (`pnpm dev:web`)
- API Worker: `http://localhost:8791` (`pnpm dev:api`)

Verify both are alive:

```bash
curl http://localhost:8791/health
```

If you see the frontend or API is not running, start them explicitly:

```bash
pnpm dev:web
pnpm dev:api
```

## Auth

Authentication is handled by Clerk.

- Web: uses `@clerk/clerk-react` and `VITE_CLERK_PUBLISHABLE_KEY`
- API: uses `@hono/clerk-auth` and `CLERK_SECRET_KEY`

If local auth is failing, ensure `.env` files are populated from `.env.example`.

## Workspace Layout

```
apps/
  web/   # TanStack Start frontend — localhost:5177
  api/   # Cloudflare Worker + Hono — localhost:8791
packages/
  config/        # shared tooling configs
  tsconfig/      # shared tsconfig
  sdk/           # contracts (providers, plugins, themes, auth)
  design-system/ # theme tokens and CSS variables
```

## Key Principles

1. **Design first, implement second.** Read `ARCHITECTURE.md`, `rfcs/`, and `adr/` before large changes.
2. **Every folder has a purpose.** Do not create folders that are not justified.
3. **Abstractions must be paid for.** If an abstraction does not solve a real problem today, do not add it.
4. **Core knows nothing about providers.** Provider details live in provider adapters registered through `packages/sdk` contracts.
5. **Core knows nothing about plugins.** Plugins register pages, commands, sidebar items, providers, themes, and settings through the plugin SDK.
6. **Themes never change layouts.** A theme defines colors, typography, radius, spacing, icons, animations, and decorations only.
7. **Application code never calls `console.log` directly.** Use the logging abstraction in `packages/sdk`.
8. **Keyboard-first UX.** Add commands to the command palette registry and shortcuts to the keyboard registry.
9. **Feature flags are explicit.** Use the feature flag registry; do not hide features with ad-hoc env checks.
10. **No cartoon UI.** Professional minimalism is the default.

## Useful Commands

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Decision Records

Before proposing new architecture, check `adr/` and `rfcs/`. If your change contradicts an existing ADR, update the ADR or discuss it first.
