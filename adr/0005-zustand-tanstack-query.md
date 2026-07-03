# ADR 0005: Use Zustand for UI State and TanStack Query for Server State

| Field | Value |
|-------|-------|
| Title | Use Zustand for UI State and TanStack Query for Server State |
| Date | 2026-07-02 |
| Status | Accepted |

## Context

KattoUI has two kinds of state:

1. **Server state** — conversations, messages, model lists, provider settings, user preferences. It is asynchronous, cacheable, and has a single source of truth on the server.
2. **UI state** — command palette open/closed, sidebar collapsed, active modal, theme selection before persistence, pending scroll position. It is synchronous and local to the client.

A single state library would either over-engineer UI state or under-serve server state.

## Decision

We will use:

- **TanStack Query** for all server state. It will handle fetching, caching, background refetching, optimistic updates, and mutation lifecycle.
- **Zustand** for all client UI state. It will manage ephemeral, non-cacheable UI concerns.

## Consequences

### Positive

- TanStack Query eliminates manual caching and staleness bugs for server data.
- Zustand keeps UI state simple, TypeScript-friendly, and free of boilerplate.
- The separation makes it obvious where any piece of state belongs.
- Both libraries are framework-aligned with the rest of the TanStack ecosystem already used in KattoUI.

### Negative / Trade-offs

- Developers must remember which state belongs in which store.
- Synchronous UI state that should persist (e.g., theme, sidebar collapse) requires deliberate persistence via Zustand middleware or TanStack Query mutation.
- Two libraries instead of one means two sets of patterns to learn.

### Related Decisions

- RFC 0001 — Architecture overview.
- RFC 0002 — Theme engine using Zustand for theme state.
