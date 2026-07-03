# AI TypeScript Guide

## Strictness

- Enable all strict compiler options defined in `@katto/tsconfig/base.json`.
- Avoid `any`. Prefer `unknown` with runtime checks when type is not known.
- Use exact optional property types and `noUncheckedIndexedAccess`.

## Types

- Prefer interfaces for public shapes and object contracts.
- Prefer type aliases for unions, mapped types, and conditional types.
- Use `satisfies` to validate inline objects against a contract.

## Validation

- Use Zod for runtime validation of external data (API payloads, env vars, plugin manifests).
- Derive static types from Zod schemas with `z.infer` when appropriate.

## Imports

- Use workspace package names (`@katto/sdk`, `@katto/design-system`) rather than relative paths crossing package boundaries.
- Inside `apps/web`, use `~/` alias for app-local imports.

## Workers

- Do not rely on Node.js built-ins unless `nodejs_compat` flag is enabled and necessary.
- Keep handlers stateless. Do not store mutable state on global scope.
