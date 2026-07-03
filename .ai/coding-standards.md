# AI Coding Standards

## General Principles

1. Design first, implement second. Update `adr/` or `rfcs/` for non-trivial architectural changes.
2. Make minimal changes. Solve today's problem, not imaginary future ones.
3. Every folder must have a purpose. Do not create speculative directories.
4. Every abstraction must be justified. If it does not solve a real problem today, do not add it.
5. No cartoon UI. Professional minimalism is the default.

## Code Quality

- Use TypeScript in strict mode; avoid `any`.
- Use Biome for lint and format. Run `pnpm lint:fix` before finishing.
- Never call `console.log` from application code. Use the logger abstraction in `packages/sdk`.
- Never use lorem ipsum or placeholder copy in user-facing UI.

## UX

- Build keyboard-first. Register commands in the command palette and shortcuts in the keyboard registry.
- Use feature flags for incomplete or experimental behavior. Do not hide features with ad-hoc env checks.
- Ensure all interactive elements have visible focus states.
- Follow the theme engine. Use semantic tokens, not hardcoded colors.
