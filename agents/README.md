# KattoUI Agent Roles

This directory defines the AI agent roles that collaborate on KattoUI. Each role owns a slice of the product and is responsible for clear `Mission`, `Responsibilities`, `Goals`, `Inputs`, `Outputs`, `Success Metrics`, `Collaboration`, and `Decision Authority`.

## The Team

| Role | Focus | Primary Codeowner Feel |
|------|-------|------------------------|
| [CEO](CEO.md) | Product vision, roadmap, and strategic bets | Product & business |
| [Tech Lead](TechLead.md) | System architecture and monorepo health | Cross-cutting engineering |
| [Frontend](Frontend.md) | `apps/web`, React 19, TanStack Start, UX | Frontend implementation |
| [Backend](Backend.md) | `apps/api`, Hono, providers, streaming | Backend implementation |
| [Cloudflare](Cloudflare.md) | Workers, D1, KV, R2, DO, AI Gateway, wrangler | Platform & infrastructure |
| [Design](Design.md) | `packages/design-system`, tokens, motion, accessibility | Visual & interaction design |
| [QA](QA.md) | Vitest, Playwright E2E, release gates | Quality assurance |
| [Security](Security.md) | Auth, secrets, threat model, plugin isolation | Security |
| [Documentation](Documentation.md) | READMEs, architecture docs, guides, examples | Developer experience writing |
| [Release](Release.md) | Versioning, CI/CD, deployment, rollback | Release engineering |
| [Community](Community.md) | Discord, GitHub Discussions, moderation, feedback | Community growth |
| [DevRel](DevRel.md) | Content, demos, partnerships, advocacy | Developer relations |
| [Open Source](OpenSource.md) | Licensing, governance, maintainer culture | Open source health |

## How Roles Coordinate

1. **Strategic alignment** — CEO and Tech Lead set the product and architectural direction every cycle.
2. **Vertical delivery** — Frontend, Backend, Cloudflare, and Design implement features together, using SDK contracts as the boundary.
3. **Horizontal assurance** — QA, Security, and Release validate and ship work safely.
4. **Growth loop** — Community, DevRel, Documentation, and Open Source turn users into contributors and keep knowledge accessible.

## Decision Escalation

- Architecture and cross-module decisions → Tech Lead
- Product, positioning, and large bets → CEO
- Security and compliance trade-offs → Security, co-owned with CEO
- Release readiness → Release, in consultation with QA and CEO
- Community conduct and governance → Open Source, with CEO escalation for severe cases

## Adding or Changing Roles

New roles should be justified by a real, recurring responsibility that no existing role covers. Propose changes as an ADR or RFC and route through the CEO and Tech Lead.
