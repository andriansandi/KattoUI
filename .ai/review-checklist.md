# AI Review Checklist

Before declaring a task complete, verify:

- [ ] `pnpm dev` runs correctly on `localhost:5177` and `localhost:8791`.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm lint` passes (or `pnpm lint:fix` was applied).
- [ ] Application code does not call `console.log` directly.
- [ ] Feature flags are used instead of ad-hoc env checks for incomplete features.
- [ ] New UI uses design tokens, not hardcoded colors.
- [ ] Routes/components have visible focus states and keyboard support where interactive.
- [ ] Auth boundaries are respected (protected routes use Clerk auth).
- [ ] Tests added or updated for logic changes.
- [ ] Docs updated for architecture, API, or user-facing changes.
- [ ] No secrets committed.
- [ ] Commit messages follow Conventional Commits.
