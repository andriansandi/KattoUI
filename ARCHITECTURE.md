# KattoUI Architecture

This document explains how KattoUI is organized, why it is organized that way, and the contracts that keep the system extensible.

---

## Repository structure

```
kattoUI/
├── apps/
│   ├── web/                 # TanStack Start frontend (port 5177)
│   └── api/                 # Cloudflare Worker + Hono API (port 8791)
├── packages/
│   ├── sdk/                 # Contracts (providers, plugins, themes, commands, auth)
│   ├── design-system/       # Theme tokens, CSS variables, shared primitives
│   ├── config/              # Shared Biome + tooling configuration
│   └── tsconfig/            # Shared TypeScript configs
├── AGENTS.md
└── ... (project docs)
```

### Apps

#### `apps/web`

- Renders the UI with React 19 and TanStack Start.
- Uses TanStack Router for file-based routing.
- Manages server-state with TanStack Query and global UI state with Zustand.
- Forms use TanStack Form validated with Zod.
- Authenticates users with `@clerk/clerk-react` using `VITE_CLERK_PUBLISHABLE_KEY`.
- Imports UI primitives and theme utilities from `@katto/design-system` and contracts from `@katto/sdk`.
- Calls the API worker at `VITE_API_URL` (default `http://localhost:8791`).

#### `apps/api`

- A Cloudflare Worker built with Hono.
- Entry point: `src/index.ts`.
- Applies CORS, request logging, and Clerk-based auth via `@clerk/backend`.
- Public route: `/health`.
- Protected routes: `/providers`, `/models`, `/chat`.
- Local dev runs through Wrangler on port `8791`.

### Packages

#### `packages/sdk`

The source of truth for every contract in the system. It defines interfaces only; it contains no runtime framework code. Exported modules include:

- `provider.ts` — `ProviderAdapter`, `Model`, `ChatMessage`, `ChatChunk`, etc.
- `plugin.ts` — `PluginManifest`, `PluginContext`, `PluginPermission`.
- `theme.ts` — `ThemeDefinition`, `ThemeTokens`, `ThemeColors`, `ThemeTypography`.
- `command.ts` — `CommandItem`, `CommandRegistry`.
- `keyboard.ts` — `ShortcutBinding`, `KeyboardRegistry`.
- `feature-flag.ts` — `FeatureFlag`, `FeatureFlagRegistry`.
- `logger.ts` — `Logger` and `LoggerFactory`.
- `auth.ts` — `AuthAdapter`, `AuthUser`, `AuthSession`.
- `telemetry.ts` — telemetry contracts.

All application code depends on `@katto/sdk` rather than embedding provider or plugin details directly.

#### `packages/design-system`

- Owns the theme engine and CSS tokens.
- Exports built-in themes: `katto`, `midnight`, `cloudflare`.
- Generates CSS custom properties from `ThemeDefinition` tokens so any theme change is application-wide without component edits.
- Provides shared UI primitives (card, button, input, badge, avatar, skeleton) used by `apps/web`.

#### `packages/config`

- Shared Biome configuration used by `pnpm lint` and `pnpm format`.
- Centralizes formatting and lint rules so both apps and packages behave identically.

#### `packages/tsconfig`

- `base.json` — shared compiler options.
- `react-app.json` — browser/React-specific settings.
- `worker.json` — Cloudflare Worker-specific settings.

---

## Provider abstraction

The core application knows nothing about OpenAI, Anthropic, Google, or Cloudflare AI Gateway. It only knows the `ProviderAdapter` interface defined in `packages/sdk/src/provider.ts`.

A provider adapter advertises:

- `metadata` — id, name, description, icon, capabilities.
- `chat()` — streaming chat implementation returning `AsyncIterable<ChatChunk>`.
- `models()` — list of supported models.
- Optional capabilities: `embeddings()`, `images()`, `speech()`.
- `health()` — runtime health status.

This lets the UI treat every provider the same way. Swapping providers is a runtime registration call; it does not require editing the chat UI.

---

## Plugin SDK

Plugins register capabilities through the `PluginContext` defined in `packages/sdk/src/plugin.ts`. The allowed surfaces are:

- Pages and sidebar items
- Command palette entries
- Toolbar actions
- Settings panels
- Providers
- Themes
- Storage read/write (keyed per plugin)

Plugins declare required permissions in their manifest. The host decides which permissions to grant at install time. This keeps the core lean while letting third-party code extend layouts, providers, and behavior.

See [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) for the full spec.

---

## Theme engine

Themes never change layouts. A theme only defines:

- Colors
- Typography
- Spacing, radius, shadows
- Animations and easing

Each `ThemeDefinition` is compiled into CSS custom properties. The `ThemeProvider` in `apps/web` applies the active theme by writing those variables to the document root. Switching themes updates every component instantly.

The default theme is `katto`. Built-in themes also include `midnight` and `cloudflare`. See [THEMING.md](./THEMING.md).

---

## Command palette

Commands are registered through the `CommandRegistry` contract. A command includes:

- `id`, `label`, `shortLabel`, `icon`
- searchable `keywords` and `group`
- optional keyboard `shortcut`
- an `execute(ctx)` handler

The command palette in `apps/web` renders any registered command and delegates execution. This makes every major action keyboard-discoverable.

---

## Keyboard shortcuts

The `KeyboardRegistry` contract lets features register `ShortcutBinding` objects with `key`, `modifier`, and `when` context. The host listens at the document level and dispatches to the first matching handler. Shortcuts are versioned alongside commands so they can be shown in the command palette and remapped later.

---

## Feature flags

Feature flags are explicit and versioned. Each flag has:

- an `id` and `name`
- a `stage`: `development`, `beta`, `experimental`, `stable`, or `deprecated`
- a `defaultValue` (boolean or string)
- an optional `override`

No feature is hidden behind ad-hoc environment checks. Code that needs to gate behavior uses the `FeatureFlagRegistry` interface.

---

## Logging and telemetry

Application code never calls `console.log` directly. Instead it uses the `Logger` abstraction from `@katto/sdk`. A logger supports:

- `debug`, `info`, `warn`, `error`, `fatal`
- structured `LogContext`
- `child(ctx)` for scoped loggers

In `apps/api` the default factory can bind to Cloudflare Workers runtime logging or external sinks. In `apps/web` it binds to the browser console in development and to a remote sink in production. `packages/sdk/src/telemetry.ts` defines how events are shaped for observability.

---

## Auth abstraction

Auth is abstracted behind `AuthAdapter` in `@katto/sdk`. The current implementation uses Clerk:

- Web: `@clerk/clerk-react` reads `VITE_CLERK_PUBLISHABLE_KEY`.
- API: `@clerk/backend` validates requests using `CLERK_SECRET_KEY`.

Because the interface is abstract, Clerk could be replaced with WorkOS, Lucia, or a custom JWT flow without changing the rest of the app.

---

## Why these decisions?

| Decision | Rationale |
|----------|-----------|
| **pnpm workspaces** | Faster installs, strict hoisting control, and a monorepo layout that scales without Turborepo complexity today. |
| **Two apps (web + api)** | Lets us deploy the frontend to Cloudflare Pages and the backend to Cloudflare Workers independently. |
| **Hono on Workers** | Tiny, fast, typed router with excellent middleware support and native Cloudflare bindings access. |
| **Tailwind CSS v4** | Modern CSS-first configuration and the design-system-friendly primitives we need. |
| **Zustand + TanStack Query** | Query handles server state; Zustand handles global client UI state. No state colocation conflicts. |
| **No SSR for the chat UI** | Streaming chat and client-side state are simpler without SSR; TanStack Start still supports SSG for marketing routes if needed. |
| **SDK package for contracts** | Guarantees that core, web, API, plugins, and themes all speak the same types. |
| **Plugin permissions** | Third-party code must declare what it needs; the host can audit and deny. |
