# Changelog

All notable changes to KattoUI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2025-07-02

### Added
- Monorepo scaffold using pnpm workspaces with `apps/` and `packages/` layout.
- `apps/web`: TanStack Start frontend running on `http://localhost:5177`.
  - React 19, TanStack Router, TanStack Query, TanStack Form.
  - Tailwind CSS v4 with shadcn/ui-style primitives.
  - Motion for animations and Lucide React for icons.
  - Zustand for client UI state and Zod for validation.
  - Clerk React integration for sign-in, sign-up, and authenticated routes.
  - Command palette, sidebar, theme switcher, and dashboard shell.
  - Settings pages: appearance, providers, models, themes, API keys, security, plugins, workspace, cloudflare, and about.
- `apps/api`: Cloudflare Worker + Hono API running on `http://localhost:8791`.
  - `/health` public route.
  - Protected `/providers`, `/models`, and `/chat` routes.
  - Clerk backend middleware for request authentication.
  - CORS configured for local development and Cloudflare Pages preview domain.
- `packages/sdk`: runtime contracts for the entire system.
  - `ProviderAdapter`, `Model`, `ChatMessage`, `ChatChunk`, embeddings, images, speech, and health abstractions.
  - `PluginManifest`, `PluginContext`, and plugin permissions.
  - `ThemeDefinition`, `ThemeTokens`, `ThemeColors`, and `ThemeTypography`.
  - `CommandItem` and `CommandRegistry` for the command palette.
  - `ShortcutBinding` and `KeyboardRegistry` for keyboard-first UX.
  - `FeatureFlag`, `FeatureFlagRegistry`, and feature lifecycle stages.
  - `Logger` / `LoggerFactory` abstraction and telemetry contracts.
  - `AuthAdapter`, `AuthUser`, and `AuthSession` abstractions.
- `packages/design-system`: theme engine and shared UI primitives.
  - Built-in themes: `katto`, `midnight`, and `cloudflare`.
  - CSS-variable generation from `ThemeDefinition` tokens.
  - Reusable `Card`, `Button`, `Input`, `Badge`, `Avatar`, and `Skeleton` components.
- `packages/config`: shared Biome configuration for linting and formatting.
- `packages/tsconfig`: shared TypeScript configs for browser apps and Workers.
- Root toolchain scripts: `dev`, `build`, `lint`, `lint:fix`, `format`, `typecheck`, `test`, and `test:e2e`.
- Environment template (`.env.example`) with Clerk and API URL variables.
- Core project documentation: `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `DECISIONS.md`, `THEMING.md`, `PLUGIN_SYSTEM.md`, `PROVIDER_API.md`, `CLOUDFLARE.md`, `SECURITY.md`, and `PRODUCT_ROADMAP.md`.

### Notes
- This is the foundational release. Chat completion logic, model providers, and persistent storage are stubbed or partially implemented and will be hardened in upcoming releases.
