# Contributing to KattoUI

Thank you for considering a contribution. KattoUI is built around a small set of architectural principles (see [ARCHITECTURE.md](./ARCHITECTURE.md) and [DECISIONS.md](./DECISIONS.md)). The best contributions are focused, minimal, and respect those boundaries.

---

## Development environment

### Prerequisites

- Node.js `>=22.0.0`
- pnpm `>=9.15.0`
- A Clerk account ([https://dashboard.clerk.com](https://dashboard.clerk.com))

### Setup

```bash
# Install dependencies
pnpm install

# Prepare environment files
cp .env.example apps/web/.env
cp .env.example apps/api/.env

# Edit both .env files with your Clerk keys
# VITE_CLERK_PUBLISHABLE_KEY / CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY

# Start the dev servers
pnpm dev
```

Verify both processes are healthy:

```bash
curl http://localhost:8791/health
```

You should see a JSON response from the API worker.

### Installing or updating packages

Always add packages from the monorepo root with the right workspace filter:

```bash
# Add a runtime dependency to the web app
pnpm --filter @katto/web add some-package

# Add a dev dependency to the API
pnpm --filter @katto/api add -D some-dev-package

# Add a dependency to a shared package
pnpm --filter @katto/sdk add -D zod
```

---

## Coding standards

- **TypeScript everywhere.** No untyped `.js` files in application code.
- **Use the SDK contracts.** Import types from `@katto/sdk` instead of duplicating shapes.
- **No direct `console.log`.** Use the `Logger` abstraction from `@katto/sdk`.
- **Feature flags are explicit.** If a feature is gated, register it in the feature flag registry. Avoid ad-hoc `process.env` checks in UI code.
- **Themes don't change layouts.** A theme only changes tokens (colors, typography, spacing, radius, motion). Layout logic stays in components.
- **Core stays ignorant.** Core code does not import provider-specific clients or plugin internals. Use the provider and plugin abstractions.
- **Keep it minimal.** Prefer small, composable functions over clever abstractions. Every abstraction must solve a real problem today.

### Formatting and linting

We use Biome for both linting and formatting.

```bash
pnpm lint       # check everything
pnpm lint:fix   # auto-fix issues
pnpm format     # format everything
```

Run these before opening a PR.

---

## Testing

### Unit tests

```bash
pnpm test
```

Vitest runs tests across the monorepo. Place unit tests next to the files they cover using the `.test.ts` or `.spec.ts` suffix.

### End-to-end tests

```bash
pnpm test:e2e
```

Playwright tests live in the project root (or `e2e/` directory as the suite grows). E2E tests require the dev servers to be running or use the `webServer` configuration in `playwright.config.ts`.

### Type checking

```bash
pnpm typecheck
```

Every package and app runs `tsc --noEmit`. This must pass in CI.

---

## Branch and pull request conventions

1. **Branch from `main`.**
2. **Name branches descriptively:**
   - `feat/chat-streaming`
   - `fix/provider-health-check`
   - `docs/security-policies`
   - `refactor/theme-engine`
3. **Keep PRs focused.** A PR should solve one problem or deliver one feature. Large refactors should be split.
4. **Update docs.** If your change affects architecture, theming, plugins, providers, or deployment, update the corresponding markdown file.
5. **Add tests.** Bug fixes and new features should include tests when feasible.
6. **Fill out the PR description.** Explain what changed, why, and how to test it.
7. **Wait for CI.** PRs must pass lint, typecheck, and tests before merge.

---

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

Common types:

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `style` — formatting, no logic change
- `refactor` — code change that neither fixes a bug nor adds a feature
- `test` — adding or updating tests
- `chore` — tooling, dependencies, CI

Examples:

```
feat(api): add streaming chat endpoint
fix(web): resolve command palette focus trap
docs: update provider adapter examples
```

---

## Need help?

Open a discussion or issue on GitHub. For security-sensitive matters, see [SECURITY.md](./SECURITY.md).
