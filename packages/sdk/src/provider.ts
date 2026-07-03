/** Provider capabilities advertised during registration. */
export interface ProviderCapabilities {
	chat: boolean;
	completions?: boolean;
	embeddings?: boolean;
	images?: boolean;
	speech?: boolean;
	transcriptions?: boolean;
	moderations?: boolean;
}

/** A model exposed by a provider. */
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

/** A chat message. */
export interface ChatMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
	name?: string;
	toolCalls?: ToolCall[];
	toolCallId?: string;
}

/** A tool call requested by the model. */
export interface ToolCall {
	id: string;
	function: {
		name: string;
		arguments: string;
	};
}

/** Options for a chat request. */
export interface ChatOptions {
	model: string;
	messages: ChatMessage[];
	temperature?: number;
	maxTokens?: number;
	stream?: boolean;
	tools?: ToolDefinition[];
	signal?: AbortSignal;
}

/** Definition of a tool available to the model. */
export interface ToolDefinition {
	type: "function";
	function: {
		name: string;
		description?: string;
		parameters: unknown;
	};
}

/** A chunk emitted during a streaming chat response. */
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

/** Options for an embedding request. */
export interface EmbeddingOptions {
	model: string;
	input: string | string[];
}

/** Result of an embedding request. */
export interface EmbeddingResult {
	model: string;
	embeddings: number[][];
	usage?: {
		promptTokens?: number;
		totalTokens?: number;
	};
}

/** Options for an image generation request. */
export interface ImageOptions {
	model: string;
	prompt: string;
	n?: number;
	size?: string;
}

/** Result of an image generation request. */
export interface ImageResult {
	created: number;
	images: Array<{ url?: string; b64Json?: string; revisedPrompt?: string }>;
}

/** Options for a text-to-speech request. */
export interface SpeechOptions {
	model: string;
	input: string;
	voice?: string;
}

/** Health status of a provider. */
export interface HealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	latency?: number;
	message?: string;
}

/** Provider metadata. */
export interface ProviderMetadata {
	id: string;
	name: string;
	description?: string;
	website?: string;
	icon?: string;
	capabilities: ProviderCapabilities;
}

/** A provider adapter registered at runtime. */
export interface ProviderAdapter {
	metadata: ProviderMetadata;
	chat(options: ChatOptions): AsyncIterable<ChatChunk>;
	models(): Promise<Model[]> | Model[];
	embeddings?(options: EmbeddingOptions): Promise<EmbeddingResult>;
	images?(options: ImageOptions): Promise<ImageResult>;
	speech?(options: SpeechOptions): Promise<ArrayBuffer>;
	health(): Promise<HealthStatus> | HealthStatus;
}
