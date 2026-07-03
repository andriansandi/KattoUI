# RFC 0003: KattoUI Provider System

| Field | Value |
|-------|-------|
| Status | Draft |
| Authors | KattoUI Core Team |
| Created | 2026-07-02 |
| Updated | 2026-07-02 |
| Related | RFC 0001, RFC 0004 |

## Summary

This RFC defines the KattoUI provider system: a contract-driven abstraction over large language model backends. Provider adapters translate KattoUI's normalized chat requests into provider-specific API calls and stream normalized chunks back. The system includes a model registry, health checks,adapter lifecycle, and a clear path for adding OpenAI, Anthropic, Google Gemini, Cloudflare Workers AI, Ollama, and future providers.

## Motivation

A self-hostable AI chat interface must avoid coupling its core to any single LLM vendor. Users will want to bring their own keys, use local models through Ollama, or route through Cloudflare AI Gateway. A provider abstraction allows the core to treat every backend identically while adapters handle protocol differences.

## Terminology

| Term | Definition |
|------|------------|
| **Provider Adapter** | An implementation of the `ProviderAdapter` interface for a specific backend. |
| **Provider Registry** | The runtime collection of registered adapters. |
| **Model Registry** | A unified list of available models, including metadata such as id, name, context window, and capabilities. |
| **Normalized Request** | A backend-agnostic chat completion request consumed by all adapters. |
| **Normalized Chunk** | A backend-agnostic stream chunk returned by all adapters. |
| **Capabilities** | A declaration of what a model/provider supports (streaming, function calling, vision, JSON mode, tool use, etc.). |

## Proposal

### 1. Provider Adapter Interface

```ts
interface ProviderAdapter {
  id: string;
  name: string;
  description?: string;

  /** List models available through this provider. */
  listModels(ctx: AdapterContext): Promise<Model[]> | Model[];

  /** Stream a chat completion. */
  streamChat(
    ctx: AdapterContext,
    request: NormalizedChatRequest,
  ): Promise<ReadableStream<NormalizedChatChunk>>;

  /** Optional non-streaming completion. */
  complete?(
    ctx: AdapterContext,
    request: NormalizedChatRequest,
  ): Promise<NormalizedChatResponse>;

  /** Validate that the provider can be reached and credentials are valid. */
  healthCheck(ctx: AdapterContext): Promise<HealthCheckResult>;

  /** Capabilities supported by this adapter. */
  capabilities?: ProviderCapability[];
}
```

### 2. Normalized Request

```ts
interface NormalizedChatRequest {
  model: string;
  messages: NormalizedMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  tools?: ToolDefinition[];
  responseFormat?: "text" | "json";
  // Opaque provider-specific extensions, passed through only to the matching adapter.
  providerOptions?: Record<string, unknown>;
}

interface NormalizedMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | MessageContentPart[];
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}
```

### 3. Normalized Stream Chunk

```ts
type NormalizedChatChunk =
  | { type: "content"; content: string }
  | { type: "toolCall"; toolCall: ToolCall }
  | { type: "usage"; usage: TokenUsage }
  | { type: "error"; error: string }
  | { type: "finish"; finishReason: string };
```

The orchestrator in `apps/api` emits these chunks to the frontend as server-sent events. The frontend renders each chunk without provider-specific parsing.

### 4. Adapter Context

```ts
interface AdapterContext {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
  logger: Logger;
  // Provider-specific configuration (endpoint, API key, model mapping, etc.).
  config: Record<string, unknown>;
}
```

Adapters receive only `AdapterContext`; they never import `process.env` directly. This keeps the same adapter testable in Workers, Node, and Vitest.

### 5. Provider Registry

```ts
class ProviderRegistry {
  register(adapter: ProviderAdapter): void;
  resolve(id: string): ProviderAdapter;
  list(): ProviderAdapter[];
  listModels(): Model[];
}
```

The registry is populated at Worker startup. Built-in adapters are registered explicitly in `apps/api`. Plugin-loaded adapters are registered through the plugin manifest.

### 6. Model Registry

The model registry is a unified, provider-aware index:

```ts
interface Model {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  contextWindow: number;
  capabilities: ModelCapability[];
  // Deprecated or hidden from selectors.
  deprecated?: boolean;
  // Preferred default for new conversations.
  recommended?: boolean;
}
```

Core populates the model selector from this registry. Caching model lists in KV reduces repeated provider API calls.

### 7. Built-in Adapters

The initial release targets at least the following adapters:

| Provider | Adapter ID | Notes |
|----------|------------|-------|
| OpenAI | `openai` | Chat Completions API, streaming. |
| Anthropic | `anthropic` | Messages API, streaming. |
| Google Gemini | `google` | Gemini API, streaming. |
| Cloudflare Workers AI | `cloudflare-ai` | REST API with `@cf/` model identifiers. |
| Ollama | `ollama` | Local `/api/chat` endpoint, streaming. |

Each adapter lives in its own file or future package to prevent one provider's SDK from leaking into another.

### 8. Streaming Pipeline

1. Frontend POSTs `/api/chat` with `{ providerId, model, messages }`.
2. API validates the request with Zod.
3. Orchestrator resolves the adapter from the registry.
4. Adapter maps normalized messages to provider format and opens the upstream stream.
5. Adapter transforms upstream events to `NormalizedChatChunk` as they arrive.
6. Orchestrator forwards chunks as server-sent events.
7. Frontend appends content chunks to the assistant message.

If the upstream connection fails, the adapter emits a normalized `{ type: "error" }` chunk and closes the stream cleanly.

### 9. Health Checks

Each adapter implements `healthCheck`. The API exposes `POST /api/providers/:providerId/health`:

```ts
interface HealthCheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
  details?: Record<string, unknown>;
}
```

Health checks are used in settings to show whether a configured provider is reachable. They are not meant to run on every request.

### 10. Security

- API keys are stored in Cloudflare secrets (not in code or UI state).
- Adapters must not log secrets or full request payloads at `info` level.
- Provider credentials are configured server-side per provider; users cannot override them from the frontend.
- Ollama adapter defaults to same-origin or explicitly configured endpoints to prevent SSRF.

## Drawbacks

1. Normalized request/response formats may not expose every provider-specific feature.
2. Adapters add maintenance overhead as upstream APIs evolve.
3. Streaming error handling must be consistent across many different HTTP client behaviors.

## Alternatives

| Alternative | Why not chosen |
|-------------|----------------|
| Use a single unified library such as Vercel AI SDK | A thin abstraction is sufficient and avoids coupling the entire runtime to a third-party package that may not support all desired providers or Cloudflare Workers constraints. |
| Provider calls from the browser | Exposes API keys and prevents server-side caching, gatewaying, and logging. |

## Adoption

1. Define `ProviderAdapter`, request, chunk, and registry types in `packages/sdk`.
2. Implement the orchestrator endpoint in `apps/api`.
3. Implement OpenAI and Cloudflare Workers AI adapters first as vertical slices.
4. Add Anthropic, Gemini, and Ollama adapters.
5. Add model list caching and health-check endpoints.
