# KattoUI

> The open-source AI workspace built for Cloudflare.

KattoUI is a fast, extensible, self-hostable AI chat interface designed for teams that want control over their AI stack without sacrificing polish. It runs on Cloudflare's edge, keeps provider details behind clean abstractions, and is organized as a pnpm workspaces monorepo so it can grow without rewriting its foundation.

The default `katto` theme uses warm, cat-inspired accents, but the UI is intentionally minimal and professional — closer to Linear, Vercel, Raycast, and GitHub than to a toy interface.

---

## Quick start

Requires **Node.js 22+** and **pnpm 9.15.0+**.

```bash
# Clone and install dependencies
pnpm install

# Copy environment files and fill in your Clerk keys
# Get keys from https://dashboard.clerk.com
cp .env.example apps/web/.env
cp .env.example apps/api/.env

# Start the dev servers
pnpm dev
```

`pnpm dev` starts both processes concurrently:

- **Web app** — TanStack Start on `http://localhost:5177`
- **API Worker** — Hono on Cloudflare Workers on `http://localhost:8791`

Verify both services are running:

```bash
curl http://localhost:8791/health
curl http://localhost:5177
```

You can also run them independently:

```bash
pnpm dev:web   # localhost:5177
pnpm dev:api   # localhost:8791
```

---

## Project architecture

The monorepo is split by responsibility:

```
apts/
  web/   # TanStack Start frontend — port 5177
  api/   # Cloudflare Worker + Hono — port 8791
packages/
  sdk/           # contracts: providers, plugins, themes, commands, auth, telemetry
  design-system/ # theme tokens, CSS variables, shared UI primitives
  config/        # shared Biome + tooling configs
  tsconfig/      # shared TypeScript configs (base, react-app, worker)
```

- **`apps/web`** renders the UI, manages state with Zustand and TanStack Query, and calls the API worker.
- **`apps/api`** is a Cloudflare Worker that exposes a Hono API, enforces Clerk auth, and routes chat/model/provider requests.
- **`packages/sdk`** defines every contract in the system: `ProviderAdapter`, `Plugin`, `ThemeDefinition`, `CommandItem`, `KeyboardRegistry`, `FeatureFlagRegistry`, `Logger`, and `AuthAdapter`. Application code imports from here instead of hard-coding provider details.
- **`packages/design-system`** owns the theme engine, CSS variables, and shared UI tokens.

---

## Features

- **Multiple AI providers** through a single `ProviderAdapter` interface.
- **Streaming chat** with tool-call support.
- **Plugin SDK** for registering pages, commands, sidebar items, settings panels, themes, toolbar actions, and providers.
- **Theme engine** with CSS-variable-driven tokens and a built-in `katto` theme.
- **Command palette** and keyboard-first shortcuts registry.
- **Feature flags** with explicit lifecycle stages.
- **Structured logging** abstraction — no direct `console.log` in application code.
- **Cloudflare-native** deployment path: Pages for the frontend, Workers for the API, D1 / KV / R2 / Durable Objects ready to bind.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend framework | React 19 + TanStack Start |
| Routing | TanStack Router |
| State / data | Zustand + TanStack Query + TanStack Form |
| Styling | Tailwind CSS v4 + shadcn/ui patterns |
| Motion | Motion (Framer Motion successor) |
| Icons | Lucide React |
| Validation | Zod |
| Auth | Clerk (`@clerk/clerk-react` on web, `@clerk/backend` on API) |
| API | Hono on Cloudflare Workers |
| Tooling | Biome, Vitest, Playwright, pnpm workspaces |

---

## Scripts

```bash
pnpm dev          # Run web + API concurrently
pnpm dev:web      # Frontend only
pnpm dev:api      # API worker only
pnpm build        # Build all packages and apps
pnpm lint         # Biome check
pnpm lint:fix     # Biome check --write
pnpm format       # Biome format --write
pnpm typecheck    # TypeScript across the monorepo
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright end-to-end tests
```

---

## Contributing

We welcome focused, minimal contributions. Please read [CONTRIBUTING.md](./CONTRIBUTING.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [DECISIONS.md](./DECISIONS.md) before proposing larger changes.

For security issues, see [SECURITY.md](./SECURITY.md).

---

## License

[MIT](./LICENSE)
