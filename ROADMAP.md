# KattoUI Roadmap

This roadmap tracks the high-level phases for building KattoUI. Each phase delivers a runnable milestone and lays the groundwork for the next one. Dates are intentional, not deadlines.

---

## Phase 0 — Foundation

**Goal:** A working monorepo, dev environment, auth flow, and CI-ready tooling.

**Deliverables:**
- pnpm workspaces configured with `apps/` and `packages/` layout.
- TanStack Start frontend running on port 5177.
- Hono API worker running on port 8791 with `/health` route.
- Clerk auth integrated on web and API.
- Lint, format, typecheck, unit tests, and end-to-end tests wired up.
- Core documentation (`README.md`, `ARCHITECTURE.md`, etc.).

**Dependencies:** None.

---

## Phase 1 — Landing & Onboarding

**Goal:** A polished public landing page and a frictionless sign-in/sign-up experience.

**Deliverables:**
- Public `index` route with feature overview.
- Sign-in and sign-up routes wired to Clerk.
- Post-auth onboarding flow (workspace name, default provider preference).
- SEO-friendly meta and OpenGraph tags.

**Dependencies:** Phase 0.

---

## Phase 2 — Auth & Workspaces

**Goal:** Multi-workspace support, user roles, and secure API key management.

**Deliverables:**
- Workspace switcher and member management.
- Roles: owner, admin, member.
- API key generation and revocation per workspace.
- Per-workspace settings persistence (KV or D1).

**Dependencies:** Phase 1.

---

## Phase 3 — Dashboard

**Goal:** A central hub that surfaces recent activity, models, and quick actions.

**Deliverables:**
- Dashboard layout with sidebar and command palette.
- Recent conversations list.
- Model/provider status cards.
- Quick-action shortcuts to start a chat or manage settings.

**Dependencies:** Phase 2.

---

## Phase 4 — Chat

**Goal:** Full streaming chat with history, branches, and tool support.

**Deliverables:**
- Conversation list and detail routes.
- Streaming chat UI with markdown rendering and code blocks.
- Message branching / edit-and-retry.
- Tool-call rendering and confirmation.
- Conversation persistence in D1.

**Dependencies:** Phase 3.

---

## Phase 5 — Providers

**Goal:** Support multiple AI providers through the `ProviderAdapter` interface.

**Deliverables:**
- OpenAI-compatible adapter.
- Anthropic adapter.
- Cloudflare Workers AI adapter via AI Gateway.
- Provider health checks and fallback ordering.
- Per-provider configuration UI.

**Dependencies:** Phase 4.

---

## Phase 6 — Cloudflare Services

**Goal:** Deep Cloudflare integration for storage, caching, and AI at the edge.

**Deliverables:**
- D1 schema for users, workspaces, conversations, messages, and API keys.
- KV for session-backed caching and feature flags.
- R2 for file and image asset storage.
- Durable Objects for real-time rooms and presence.
- AI Gateway routing and observability.
- Vectorize for RAG index storage.
- Queues for async jobs.
- Hyperdrive if external databases are needed.

**Dependencies:** Phase 5.

---

## Phase 7 — Plugin SDK

**Goal:** A stable plugin surface so third-party code can extend KattoUI safely.

**Deliverables:**
- Runtime plugin loader.
- Manifest validation with Zod.
- Permission model enforced by the host.
- Storage, network, and MCP access controls.
- Plugin settings panels and toolbar actions.
- Plugin marketplace listing format.

**Dependencies:** Phase 4.

---

## Phase 8 — Theme Marketplace

**Goal:** Users can install, preview, and switch themes without code changes.

**Deliverables:**
- Theme gallery UI.
- Theme import/export format.
- Theme preview mode.
- Community theme submissions.

**Dependencies:** Phase 7.

---

## Phase 9 — MCP

**Goal:** KattoUI works as an MCP client and host, letting models use external tools.

**Deliverables:**
- MCP client implementation.
- Tool registry populated from MCP servers.
- Server configuration UI.
- Secure execution context for MCP tools.

**Dependencies:** Phase 7.

---

## Phase 10 — Agents

**Goal:** Stateful, long-running agents using Cloudflare Agents SDK.

**Deliverables:**
- Agent orchestration on Durable Objects.
- Agent memory and scheduled tasks.
- Agent designer UI.
- Tool use and multi-step workflows.

**Dependencies:** Phase 9.

---

## Phase 11 — Marketplace

**Goal:** A discoverable marketplace for plugins, themes, agents, and MCP servers.

**Deliverables:**
- In-app marketplace browsing and install flow.
- Versioning and update notifications.
- Publisher verification.
- Review and rating system.

**Dependencies:** Phases 7, 8, 10.

---

## Current phase

We are in **Phase 0 — Foundation**. The monorepo, dev servers, auth, and core documentation are in place. Next, we move into Phase 1: Landing & Onboarding.
