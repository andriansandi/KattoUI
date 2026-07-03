# ADR 0002: Use Clerk for Authentication

| Field | Value |
|-------|-------|
| Title | Use Clerk for Authentication with a Future Self-Hosting Abstraction |
| Date | 2026-07-02 |
| Status | Accepted |

## Context

KattoUI needs authentication for chat users, administrators, and future organization features. Building a full auth system (passwords, sessions, MFA, organization support) from scratch would delay core product work and introduce security risk. At the same time, the project is "self-hostable," which implies that some users may eventually want to run KattoUI without depending on a third-party auth SaaS.

## Decision

We will use **Clerk** as the default authentication provider for KattoUI. We will introduce an abstraction layer in `packages/sdk` so that the frontend and API do not depend directly on Clerk types or APIs. If demand and resources allow, a self-hosted auth backend can later implement the same abstraction without rewriting the application.

## Consequences

### Positive

- Clerk handles sign-in, sign-up, session management, MFA, organizations, and account linking out of the box.
- `@clerk/clerk-react` provides polished, themeable UI components that can be synchronized with the active theme.
- `@hono/clerk-auth` integrates Clerk session validation into the Hono Worker with minimal code.
- The abstraction layer keeps the door open for a future self-hosted auth provider.

### Negative / Trade-offs

- Clerk is a third-party SaaS dependency. Users who want fully offline self-hosting will require an alternative adapter.
- The abstraction layer adds some initial boilerplate compared to direct Clerk usage.
- Clerk pricing must be considered as the project scales, though self-hosters bring their own Clerk account.

### Related Decisions

- RFC 0002 — Theme engine, including Clerk appearance sync.
- RFC 0005 — Cloudflare runtime, where Clerk secrets are managed.
