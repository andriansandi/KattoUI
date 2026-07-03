# Provider API

KattoUI talks to AI providers through a small, typed adapter interface. Core code does not know about OpenAI, Anthropic, Google, or Cloudflare AI Gateway; it only knows `ProviderAdapter`.

---

## ProviderAdapter interface

Defined in `packages/sdk/src/provider.ts`:

```ts
export interface ProviderAdapter {
  metadata: ProviderMetadata;
  chat(options: ChatOptions): AsyncIterable<ChatChunk>;
  models(): Promise<Model[]> | Model[];
  embeddings?(options: EmbeddingOptions): Promise<EmbeddingResult>;
  images?(options: ImageOptions): Promise<ImageResult>;
  speech?(options: SpeechOptions): Promise<ArrayBuffer>;
  health(): Promise<HealthStatus> | HealthStatus;
}
```

### Metadata

```ts
export interface ProviderMetadata {
  id: string;
  name: string;
  description?: string;
  website?: string;
  icon?: string;
  capabilities: ProviderCapabilities;
}

export interface ProviderCapabilities {
  chat: boolean;
  completions?: boolean;
  embeddings?: boolean;
  images?: boolean;
  speech?: boolean;
  transcriptions?: boolean;
  moderations?: boolean;
}
```

`id` must be unique across the system. `capabilities` tells the UI which features to expose.

### Chat

```ts
export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: ToolDefinition[];
  signal?: AbortSignal;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ChatChunk {
  type: "content" | "tool_call" | "usage" | "error" | "done";
  content?: string;
  toolCall?: ToolCall;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  error?: string;
}
```

The `chat()` method is expected to return an async iterable even for non-streaming requests. The UI consumes chunks uniformly.

### Models

```ts
export interface Model {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  capabilities: Array<"chat" | "vision" | "tools" | "reasoning" | "json" | "embeddings">;
  pricing?: {
    input?: number;
    output?: number;
  };
}
```

### Embeddings

```ts
export interface EmbeddingOptions {
  model: string;
  input: string | string[];
}

export interface EmbeddingResult {
  model: string;
  embeddings: number[][];
  usage?: {
    promptTokens?: number;
    totalTokens?: number;
  };
}
```

### Images

```ts
export interface ImageOptions {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
}

export interface ImageResult {
  created: number;
  images: Array<{ url?: string; b64Json?: string; revisedPrompt?: string }>;
}
```

### Speech

```ts
export interface SpeechOptions {
  model: string;
  input: string;
  voice?: string;
}
```

Returns raw audio as `ArrayBuffer`.

### Health

```ts
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
}
```

The dashboard and provider settings use health checks to show status.

---

## Registration

Providers can be registered in two ways:

1. **Built-in adapters** — imported in `apps/api` and registered at worker startup.
2. **Plugins** — a plugin calls `ctx.registerProvider(adapter)` during activation.

The host stores the adapter in a provider registry keyed by `metadata.id`. The UI queries `/providers` and `/models` to discover what is available.

---

## Example: mock provider

Below is a complete mock adapter that echoes user messages back. Useful for tests and UI development without API keys.

```ts
import type {
  ChatOptions,
  ChatChunk,
  Model,
  ProviderAdapter,
  HealthStatus,
  ProviderMetadata,
} from "@katto/sdk";

const metadata: ProviderMetadata = {
  id: "mock",
  name: "Mock Provider",
  description: "Echoes user messages for development and testing.",
  icon: "bot",
  capabilities: { chat: true },
};

export const mockProvider: ProviderAdapter = {
  metadata,

  async *chat(options: ChatOptions): AsyncIterable<ChatChunk> {
    const lastUserMessage = [...options.messages]
      .reverse()
      .find((m) => m.role === "user");

    const text = lastUserMessage?.content ?? "Hello!";

    yield { type: "content", content: "Echo: " };
    for (const word of text.split(" ")) {
      yield { type: "content", content: word + " " };
    }
    yield { type: "usage", usage: { promptTokens: 1, completionTokens: text.length, totalTokens: text.length + 1 } };
    yield { type: "done" };
  },

  models(): Model[] {
    return [
      {
        id: "mock-echo",
        name: "Mock Echo",
        providerId: metadata.id,
        capabilities: ["chat"],
      },
    ];
  },

  health(): HealthStatus {
    return { status: "healthy", latency: 0, message: "Mock provider is always healthy." };
  },
};
```

Register it:

```ts
import { mockProvider } from "./providers/mock";

providerRegistry.register(mockProvider);
```

---

## API routes

`apps/api` exposes the following provider-related routes:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/providers` | Required | List registered provider metadata. |
| GET | `/models` | Required | List available models across all providers. |
| POST | `/chat` | Required | Start a chat completion; returns a stream. |
| GET | `/health` | Public | Health check for the API worker. |

---

## Error handling

Adapters should emit `ChatChunk` with `type: "error"` for recoverable streaming errors. Fatal errors should throw, and the API layer will translate them into an appropriate HTTP or stream error response. Always propagate human-readable `message` fields where possible.
