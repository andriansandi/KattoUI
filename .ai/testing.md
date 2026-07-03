# AI Testing Guide

## Strategy

- **Unit tests**: utilities, registries, pure functions. Use Vitest.
- **Component tests**: interactive UI components. Use React Testing Library with Vitest.
- **Integration tests**: API routes with Hono's `app.request()`. Run in Node or Worker runtime.
- **E2E tests**: critical user flows. Use Playwright.
- **Visual/a11y tests**: add when UI stabilizes.

## Conventions

- Name test files `*.test.ts` or `*.spec.ts`.
- Use factory functions for test data instead of deep object literals.
- Mock external services (Clerk, providers, telemetry) at the boundary.

## Before Finishing

Run:

```bash
pnpm test
pnpm test:e2e
```

If tests fail, fix before declaring a task complete.
