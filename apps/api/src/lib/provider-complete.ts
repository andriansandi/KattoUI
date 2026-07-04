import type { ProviderType } from "@katto/sdk/chat";

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
 * Sends a non-streaming chat completion to the configured provider. OpenAI and
 * custom providers share the `/chat/completions` shape; Anthropic uses
 * `/messages` with the system prompt carried in a top-level `system` field.
 */
export async function completeChat(params: CompleteChatParams): Promise<string> {
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
}): Promise<string> {
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
		choices?: Array<{ message?: { content?: string } }>;
	};
	const content = json.choices?.[0]?.message?.content;
	if (typeof content !== "string" || content.length === 0) {
		throw new ProviderCompleteError("Empty completion content");
	}
	return content;
}

async function completeAnthropic(args: {
	origin: string;
	apiToken: string;
	model: string;
	systemPrompt?: string | undefined;
	messages: ChatMessage[];
	maxTokens?: number | undefined;
	signal?: AbortSignal | undefined;
}): Promise<string> {
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
		content?: Array<{ type?: string; text?: string }>;
	};
	const text = json.content?.find((block) => block.type === "text")?.text;
	if (typeof text !== "string" || text.length === 0) {
		throw new ProviderCompleteError("Empty completion content");
	}
	return text;
}
