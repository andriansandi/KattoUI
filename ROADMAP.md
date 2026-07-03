# KattoUI Roadmap

> Build the best AI chat interface first.
> Everything else extends from it.

The chat experience is the product. Providers, models, plugins, agents, and the marketplace are extensions. Each phase delivers one polished experience and leaves KattoUI feeling complete rather than incomplete.

---

## Phase 0 — Foundation (complete)

**Goal:** A solid engineering foundation.

**Deliverables:**
- Monorepo
- Authentication
- SDK contracts
- Theme engine
- API
- Design system
- Documentation
- CI
- Testing

**Success:** A new contributor can run `pnpm install && pnpm dev` and see the app and API within five minutes.

---

## Phase 1 — Chat Experience

**Goal:** Deliver a chat interface people genuinely enjoy using every day.

### Chat

- Beautiful empty state
- Streaming
- Markdown
- Syntax highlighting
- Code blocks
- Copy
- Regenerate
- Stop generation
- Message editing
- Auto scroll
- Thinking indicator
- Token usage
- Keyboard shortcuts
- Command palette

### Conversations

- Conversation list
- Search conversations
- Rename
- Delete
- Pin
- Favorites
- Responsive layout

### UX

- Fast
- Minimal
- Keyboard first
- Smooth animations
- Professional spacing
- Cat personality without becoming cartoon

**Success:** Sub-second time-to-first-token locally; conversation history loads in < 300ms. Users should feel comfortable replacing ChatGPT or Claude for their daily work.

---

## Phase 2 — Providers

**Goal:** Connect every major AI provider through one consistent interface.

**Deliverables:**
- OpenAI
- Anthropic
- Gemini
- OpenRouter
- Cloudflare Workers AI
- Ollama

### Provider settings

- API keys
- Health
- Latency
- Default provider
- Failover

**Success:** Changing providers should never change the chat experience. Users can switch providers mid-conversation without data loss.

---

## Phase 3 — Models

**Goal:** Make choosing models delightful.

**Deliverables:**
- Model picker
- Favorites
- Recent
- Pinned
- Search
- Capabilities
- Context window
- Pricing
- Reasoning badge
- Vision badge

**Success:** Model switching becomes effortless.

---

## Phase 4 — Themes

**Goal:** Build KattoUI's identity.

### Built-in themes

- Katto
- Midnight
- Cloudflare

### Focus

Professional first. Cats only exist as subtle personality:

- Paw loading
- Empty state
- Icons
- Easter eggs
- Motion

Never cartoon.

**Success:** Any theme can be previewed before applying.

---

## Phase 5 — Workspace

**Goal:** Support teams.

**Deliverables:**
- Workspace
- Members
- Roles
- API keys
- Shared conversations

**Success:** Users can create/join a workspace, invite members, and rotate API keys without downtime.

---

## Phase 6 — Plugins

**Goal:** Allow developers to extend KattoUI.

**Deliverables:**
- Plugin SDK
- Commands
- Pages
- Toolbar
- Providers
- Themes
- Settings

**Success:** A third-party plugin can be installed and uninstalled without host code changes.

---

## Phase 7 — Cloudflare Platform

**Goal:** Leverage Cloudflare services.

**Deliverables:**
- AI Gateway
- D1
- KV
- R2
- Durable Objects
- Vectorize
- Queues

**Success:** All chat state and assets live in Cloudflare-bound services.

---

## Phase 8 — MCP

**Goal:** Become the best MCP client.

**Deliverables:**
- MCP servers
- Tool registry
- Resources
- Prompt library

**Success:** Users can connect an MCP server and invoke tools from chat.

---

## Phase 9 — Agents

**Goal:** Autonomous workflows.

**Deliverables:**
- Memory
- Scheduling
- Background tasks
- Agent designer

**Success:** Agents can run multi-step workflows autonomously and report status.

---

## Phase 10 — Marketplace

**Goal:** Community ecosystem.

**Deliverables:**
- Plugins
- Themes
- Agents
- MCP servers
- Prompt packs

**Success:** Curated marketplace items install with one click and update automatically.

---

## Product Philosophy

KattoUI does not try to expose every capability on day one. Instead, every release expands naturally from one polished experience:

Chat → Providers → Models → Themes → Workspace → Plugins → Cloudflare → MCP → Agents → Marketplace

The interface should evolve alongside the roadmap. Users should never feel overwhelmed by unfinished features. Every phase should leave KattoUI feeling complete rather than incomplete.
