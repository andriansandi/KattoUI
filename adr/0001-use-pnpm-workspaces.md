# ADR 0001: Use pnpm Workspaces

| Field | Value |
|-------|-------|
| Title | Use pnpm Workspaces Instead of Turborepo or Nx |
| Date | 2026-07-02 |
| Status | Accepted |

## Context

KattoUI is a monorepo containing at least two applications (`apps/web` and `apps/api`) and four shared packages (`packages/sdk`, `packages/design-system`, `packages/config`, `packages/tsconfig`). We needed a workspace tool that supports package isolation, fast installs, strict dependency control, and a clear path to add more packages later without restructuring.

## Decision

We will use **pnpm workspaces** as the monorepo foundation. We will not introduce Turborepo, Nx, or another task runner until there is a concrete problem (such as complex task pipelines or remote caching) that pnpm scripts cannot solve.

## Consequences

### Positive

- pnpm provides first-class workspace support with `pnpm-workspace.yaml`.
- Strict `node_modules` symlinking prevents phantom dependencies and surfaces missing package imports early.
- The lockfile and hoisting behavior are predictable and fast.
- Tooling configuration lives in `packages/config` and is consumed by workspace members.
- The mental model is simple: every directory under `apps/*` and `packages/*` is a package with a clear responsibility.

### Negative / Trade-offs

- pnpm alone has no built-in task pipeline orchestration or remote caching. We will rely on npm scripts and, if needed, a lightweight task runner later.
- Teams familiar with Turborepo/Nx may need a short adjustment period.
- As the monorepo grows, build graph complexity may eventually justify adding Turborepo on top of pnpm, but that decision will be made with real data.

### Related Decisions

- RFC 0001 — Monorepo architecture overview.
