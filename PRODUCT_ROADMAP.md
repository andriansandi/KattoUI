# Product Roadmap

This document maps product milestones for KattoUI, including goals, deliverables, dependencies, complexity, risks, and success criteria.

---

## Phase 0 — Foundation

**Goal:** A runnable, version-controlled base that a team can develop against.

| Attribute | Detail |
|-----------|--------|
| **Deliverables** | Monorepo, dev servers, Clerk auth, lint/typecheck/tests, core docs. |
| **Dependencies** | None. |
| **Complexity** | Low |
| **Risks** | Tooling version drift; Clerk setup friction for new contributors. |
| **Success criteria** | A new contributor can run `pnpm install && pnpm dev` and see the app and API within five minutes. |

---

## Phase 1 — Landing & Onboarding

**Goal:** Convert visitors into signed-up users.

| Attribute | Detail |
|-----------|--------|
| **Deliverables** | Public landing page, sign-in/sign-up, post-auth onboarding, SEO meta. |
| **Dependencies** | Phase 0. |
| **Complexity** | Low–Medium |
| **Risks** | Onboarding flow becomes a drop-off point if too long. |
| **Success criteria** | 80%+ of sign-ups complete onboarding; landing LCP < 1.5s. |

---

## Phase 2 — Auth & Workspaces

**Goal:** Teams can organize around workspaces with proper access control.

| Attribute | Detail |
|-----------|--------|
| **Deliverables** | Workspace CRUD, member invitations, roles, API keys per workspace. |
| **Dependencies** | Phase 1. |
| **Complexity** | Medium |
| **Risks** | Role edge cases; permission regression in shared resources. |
| **Success criteria** | Users can create/join a workspace, invite members, and rotate API keys without downtime. |

---

## Phase 3 — Dashboard

**Goal:** A productive home screen for daily use.

| Attribute | Detail |
|-----------|--------|
| **Deliverables** | Dashboard layout, recent conversations, model status, quick actions, command palette integration. |
| **Dependencies** | Phase 2. |
| **Complexity** | Medium |
| **Risks** | Information density; too much noise on first load. |
| **Success criteria** | Users can start a new chat or reach any setting in ≤ 2 interactions. |

---

## Phase 4 — Chat

**Goal:** A polished, reliable chat experience.

| Attribute | Detail |
|-----------|--------|
| **Deliverables** | Conversation list/detail, streaming chat, markdown + code blocks, branches, tool-call rendering, D1 persistence. |
| **Dependencies** | Phase 3. |
| **Complexity** | High |
| **Risks** | Streaming edge cases across providers; conversation history performance at scale. |
| **Success criteria** | Sub-second time-to-first-token locally; conversation history loads in < 300ms. |

---

## Future phases

### Phase 5 — Providers
- **Goal:** Ship multiple provider adapters and health-based fallbacks.
- **Deliverables:** OpenAI, Anthropic, Cloudflare Workers AI adapters; provider settings UI.
- **Dependencies:** Phase 4.
- **Complexity:** Medium.
- **Risks:** Provider API differences breaking the unified `ProviderAdapter` contract.
- **Success criteria:** Users can switch providers mid-conversation without data loss.

### Phase 6 — Cloudflare Services
- **Goal:** Leverage Cloudflare's edge-native stack for scale.
- **Deliverables:** D1 schema, KV caching, R2 uploads, Durable Objects rooms, AI Gateway, Vectorize RAG, Queues.
- **Dependencies:** Phase 5.
- **Complexity:** High.
- **Risks:** Binding complexity; migration paths for schema changes.
- **Success criteria:** All chat state and assets live in Cloudflare-bound services.

### Phase 7 — Plugin SDK
- **Goal:** Let third-party developers extend KattoUI safely.
- **Deliverables:** Runtime loader, permission model, marketplace manifest, storage/network controls.
- **Dependencies:** Phase 4.
- **Complexity:** High.
- **Risks:** Plugin security incidents; sandbox escape.
- **Success criteria:** A third-party plugin can be installed and uninstalled without host code changes.

### Phase 8 — Theme Marketplace
- **Goal:** Users can install and switch themes without code.
- **Deliverables:** Theme gallery, import/export, preview mode.
- **Dependencies:** Phase 7.
- **Complexity:** Low.
- **Risks:** Malicious CSS injection.
- **Success criteria:** Any theme can be previewed before applying.

### Phase 9 — MCP
- **Goal:** KattoUI works as an MCP client and host.
- **Deliverables:** MCP client, tool registry, server config UI, secure execution context.
- **Dependencies:** Phase 7.
- **Complexity:** High.
- **Risks:** Tool permission confusion; remote server failures.
- **Success criteria:** Users can connect an MCP server and invoke tools from chat.

### Phase 10 — Agents
- **Goal:** Stateful agents using Cloudflare Agents SDK.
- **Deliverables:** Agent orchestration, memory, schedules, designer UI.
- **Dependencies:** Phase 9.
- **Complexity:** Very High.
- **Risks:** Agent reliability; long-running cost.
- **Success criteria:** Agents can run multi-step workflows autonomously and report status.

### Phase 11 — Marketplace
- **Goal:** Discover and install plugins, themes, agents, and MCP servers.
- **Deliverables:** In-app marketplace, versioning, updates, publisher verification, reviews.
- **Dependencies:** Phases 7, 8, 10.
- **Complexity:** Very High.
- **Risks:** Trust and safety; fraud; compatibility matrix.
- **Success criteria:** Curated marketplace items install with one click and update automatically.

---

## Current milestone

We are executing **Phase 0 — Foundation**. Acceptance criteria include passing lint, typecheck, and tests, plus the core documentation set you are reading now.
