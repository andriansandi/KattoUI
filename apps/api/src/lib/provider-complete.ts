import type { ProviderType } from "@katto/sdk/chat";
import type { ChatChunk } from "@katto/sdk/provider";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface CompleteChatParams {
	type: ProviderType;
	baseUrl: string;
	apiToken: string;
	model: string;
	systemPrompt?: string;
	messages: ChatMessage[];
	maxTokens?: number;
	signal?: AbortSignal;
}

export interface CompletionResult {
	content: string;
	reasoning?: string;
}

export class ProviderCompleteError extends Error {
	constructor(
		message: string,
		readonly status?: number,
	) {
		super(message);
		this.name = "ProviderCompleteError";
	}
}

/**
 * Reads the upstream error response body and builds a descriptive message.
 * Falls back to status text when the body is not JSON or has no message.
 */
async function buildProviderError(res: Response): Promise<ProviderCompleteError> {
	let detail = `${res.status} ${res.statusText}`;
	try {
		const body = (await res.json()) as { error?: { message?: string }; message?: string };
		const msg = body.error?.message ?? body.message;
		if (msg) detail = `${res.status} — ${msg}`;
	} catch {
		// response body is not JSON — use status text only
	}
	return new ProviderCompleteError(`Provider responded ${detail}`, res.status);
}

/**
 * Sends a non-streaming chat completion to the configured provider. OpenAI and
 * custom providers share the `/chat/completions` shape; Anthropic uses
 * `/messages` with the system prompt carried in a top-level `system` field.
 */
export async function completeChat(params: CompleteChatParams): Promise<CompletionResult> {
	const origin = params.baseUrl.replace(/\/$/, "");
	if (params.type === "anthropic") {
		return completeAnthropic({
			origin,
			apiToken: params.apiToken,
			model: params.model,
			systemPrompt: params.systemPrompt,
			messages: params.messages,
			maxTokens: params.maxTokens,
			signal: params.signal,
		});
	}
	return completeOpenAi({
		origin,
		apiToken: params.apiToken,
		model: params.model,
		systemPrompt: params.systemPrompt,
		messages: params.messages,
		maxTokens: params.maxTokens,
		signal: params.signal,
	});
}

async function completeOpenAi(args: {
	origin: string;
	apiToken: string;
	model: string;
	systemPrompt?: string | undefined;
	messages: ChatMessage[];
	maxTokens?: number | undefined;
	signal?: AbortSignal | undefined;
}): Promise<CompletionResult> {
	const messages: Array<{ role: string; content: string }> = [...args.messages];
	if (args.systemPrompt) {
		messages.unshift({ role: "system", content: args.systemPrompt });
	}

	const body: Record<string, unknown> = { model: args.model, messages };
	if (args.maxTokens !== undefined) {
		body.max_tokens = args.maxTokens;
	}

	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (args.apiToken) {
		headers.Authorization = `Bearer ${args.apiToken}`;
	}

	const res = await fetch(`${args.origin}/chat/completions`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: args.signal ?? null,
	});
	if (!res.ok) {
		throw new ProviderCompleteError(
			`Provider responded ${res.status} ${res.statusText}`,
			res.status,
		);
	}

	const json = (await res.json()) as {
		choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
	};
	const message = json.choices?.[0]?.message;
	const content = message?.content;
	if (typeof content !== "string" || content.length === 0) {
		throw new ProviderCompleteError("Empty completion content");
	}
	const result: CompletionResult = { content };
	if (typeof message?.reasoning_content === "string" && message.reasoning_content.length > 0) {
		result.reasoning = message.reasoning_content;
	}
	return result;
}

async function completeAnthropic(args: {
	origin: string;
	apiToken: string;
	model: string;
	systemPrompt?: string | undefined;
	messages: ChatMessage[];
	maxTokens?: number | undefined;
	signal?: AbortSignal | undefined;
}): Promise<CompletionResult> {
	const body: Record<string, unknown> = {
		model: args.model,
		messages: args.messages,
		max_tokens: args.maxTokens ?? 1024,
	};
	if (args.systemPrompt) {
		body.system = args.systemPrompt;
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"anthropic-version": "2023-06-01",
	};
	if (args.apiToken) {
		headers["x-api-key"] = args.apiToken;
	}

	const res = await fetch(`${args.origin}/messages`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: args.signal ?? null,
	});
	if (!res.ok) {
		throw new ProviderCompleteError(
			`Provider responded ${res.status} ${res.statusText}`,
			res.status,
		);
	}

	const json = (await res.json()) as {
		content?: Array<{ type?: string; text?: string; thinking?: string }>;
	};
	const blocks = json.content ?? [];
	const textBlock = blocks.find((block) => block.type === "text");
	const text = textBlock?.text;
	if (typeof text !== "string" || text.length === 0) {
		throw new ProviderCompleteError("Empty completion content");
	}
	const result: CompletionResult = { content: text };
	const thinkingParts = blocks
		.filter((block) => block.type === "thinking" && typeof block.thinking === "string")
		.map((block) => block.thinking as string);
	if (thinkingParts.length > 0) {
		result.reasoning = thinkingParts.join("");
	}
	return result;
}

/* ---------------------------------------------------------------------------
 * Streaming completion
 * -------------------------------------------------------------------------*/

/**
 * Streams a chat completion from the configured provider, yielding normalized
 * `ChatChunk` values as content arrives. Reuses the same provider dispatch and
 * header logic as `completeChat`.
 */
export async function* completeChatStream(params: CompleteChatParams): AsyncGenerator<ChatChunk> {
	const origin = params.baseUrl.replace(/\/$/, "");
	if (params.type === "anthropic") {
		yield* completeAnthropicStream({
			origin,
			apiToken: params.apiToken,
			model: params.model,
			systemPrompt: params.systemPrompt,
			messages: params.messages,
			maxTokens: params.maxTokens,
			signal: params.signal,
		});
		return;
	}
	yield* completeOpenAiStream({
		origin,
		apiToken: params.apiToken,
		model: params.model,
		systemPrompt: params.systemPrompt,
		messages: params.messages,
		maxTokens: params.maxTokens,
		signal: params.signal,
	});
}

async function* completeOpenAiStream(args: {
	origin: string;
	apiToken: string;
	model: string;
	systemPrompt?: string | undefined;
	messages: ChatMessage[];
	maxTokens?: number | undefined;
	signal?: AbortSignal | undefined;
}): AsyncGenerator<ChatChunk> {
	const messages: Array<{ role: string; content: string }> = [...args.messages];
	if (args.systemPrompt) {
		messages.unshift({ role: "system", content: args.systemPrompt });
	}

	const body: Record<string, unknown> = {
		model: args.model,
		messages,
		stream: true,
		stream_options: { include_usage: true },
	};
	if (args.maxTokens !== undefined) {
		body.max_tokens = args.maxTokens;
	}

	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (args.apiToken) {
		headers.Authorization = `Bearer ${args.apiToken}`;
	}

	const res = await fetch(`${args.origin}/chat/completions`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: args.signal ?? null,
	});
	if (!res.ok) {
		throw await buildProviderError(res);
	}
	if (!res.body) {
		throw new ProviderCompleteError("No response body");
	}

	for await (const event of parseSseStream(res.body)) {
		if (event.data === "[DONE]") {
			yield { type: "done" };
			return;
		}
		let json: Record<string, unknown>;
		try {
			json = JSON.parse(event.data) as Record<string, unknown>;
		} catch {
			continue;
		}
		const error = json.error as { message?: string } | undefined;
		if (error?.message) {
			yield { type: "error", error: error.message };
			return;
		}
		const choices = json.choices as
			| Array<{ delta?: { content?: string; reasoning_content?: string } }>
			| undefined;
		const delta = choices?.[0]?.delta;
		const content = delta?.content;
		if (typeof content === "string" && content.length > 0) {
			yield { type: "content", content };
		}
		const reasoning = delta?.reasoning_content;
		if (typeof reasoning === "string" && reasoning.length > 0) {
			yield { type: "reasoning", content: reasoning };
		}
		const usage = json.usage as
			| { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
			| undefined;
		if (usage) {
			const u: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {};
			if (usage.prompt_tokens !== undefined) u.promptTokens = usage.prompt_tokens;
			if (usage.completion_tokens !== undefined) u.completionTokens = usage.completion_tokens;
			if (usage.total_tokens !== undefined) u.totalTokens = usage.total_tokens;
			yield { type: "usage", usage: u };
		}
	}
}

async function* completeAnthropicStream(args: {
	origin: string;
	apiToken: string;
	model: string;
	systemPrompt?: string | undefined;
	messages: ChatMessage[];
	maxTokens?: number | undefined;
	signal?: AbortSignal | undefined;
}): AsyncGenerator<ChatChunk> {
	const body: Record<string, unknown> = {
		model: args.model,
		messages: args.messages,
		max_tokens: args.maxTokens ?? 4096,
		stream: true,
	};
	if (args.systemPrompt) {
		body.system = args.systemPrompt;
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"anthropic-version": "2023-06-01",
	};
	if (args.apiToken) {
		headers["x-api-key"] = args.apiToken;
	}

	const res = await fetch(`${args.origin}/messages`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: args.signal ?? null,
	});
	if (!res.ok) {
		throw await buildProviderError(res);
	}
	if (!res.body) {
		throw new ProviderCompleteError("No response body");
	}

	let inputTokens: number | undefined;

	for await (const event of parseSseStream(res.body)) {
		let json: Record<string, unknown>;
		try {
			json = JSON.parse(event.data) as Record<string, unknown>;
		} catch {
			continue;
		}
		const type = json.type as string | undefined;
		if (type === "message_start") {
			const message = json.message as { usage?: { input_tokens?: number } } | undefined;
			inputTokens = message?.usage?.input_tokens;
		} else if (type === "content_block_delta") {
			const delta = json.delta as { type?: string; text?: string; thinking?: string } | undefined;
			if (delta?.type === "text_delta" && typeof delta.text === "string") {
				yield { type: "content", content: delta.text };
			} else if (delta?.type === "thinking_delta" && typeof delta.thinking === "string") {
				yield { type: "reasoning", content: delta.thinking };
			}
		} else if (type === "message_delta") {
			const usage = json.usage as { output_tokens?: number } | undefined;
			if (usage?.output_tokens !== undefined) {
				const u: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {
					completionTokens: usage.output_tokens,
				};
				if (inputTokens !== undefined) {
					u.promptTokens = inputTokens;
					u.totalTokens = inputTokens + usage.output_tokens;
				}
				yield { type: "usage", usage: u };
			}
		} else if (type === "error") {
			const error = json.error as { message?: string } | undefined;
			yield { type: "error", error: error?.message ?? "Unknown provider error" };
			return;
		} else if (type === "message_stop") {
			yield { type: "done" };
			return;
		}
	}
}

/* ---------------------------------------------------------------------------
 * SSE parsing
 * -------------------------------------------------------------------------*/

interface SseEvent {
	event?: string | undefined;
	data: string;
}

/**
 * Parses a `ReadableStream<Uint8Array>` of SSE-formatted data into individual
 * events. Buffers bytes, splits on double-newline boundaries, and extracts
 * `event:` / `data:` fields from each block.
 */
async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			let idx = buffer.indexOf("\n\n");
			while (idx !== -1) {
				const block = buffer.slice(0, idx);
				buffer = buffer.slice(idx + 2);
				const parsed = parseSseBlock(block);
				if (parsed !== null) yield parsed;
				idx = buffer.indexOf("\n\n");
			}
		}
		if (buffer.trim().length > 0) {
			const parsed = parseSseBlock(buffer);
			if (parsed !== null) yield parsed;
		}
	} finally {
		reader.releaseLock();
	}
}

function parseSseBlock(block: string): SseEvent | null {
	let event: string | undefined;
	const dataLines: string[] = [];
	for (const line of block.split("\n")) {
		if (line.startsWith("event: ")) {
			event = line.slice(7).trim();
		} else if (line.startsWith("data: ")) {
			dataLines.push(line.slice(6));
		}
	}
	if (dataLines.length === 0) return null;
	return { event, data: dataLines.join("\n") };
}
