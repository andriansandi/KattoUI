/** Supported provider types. */
export type ProviderType = "openai" | "anthropic" | "custom";

/** Provider health states reported by a connection test. */
export type ProviderStatus = "healthy" | "degraded" | "unhealthy";

/** A model entry in a provider config's catalog. */
export interface ProviderModelEntry {
	id: string;
	name: string;
	enabled: boolean;
	reasoning?: boolean;
}

/** Enabled models grouped by provider config, for the chat model selector. */
export interface ProviderModelGroup {
	providerConfigId: string;
	providerName: string;
	models: Array<{ id: string; name: string; reasoning?: boolean }>;
}

/** A provider configuration stored per user. */
export interface ProviderConfig {
	id: string;
	userId: string;
	name: string;
	type: ProviderType;
	baseUrl: string;
	defaultModel?: string;
	streaming?: boolean;
	isConfigured: boolean;
	/** Last connection-test result. Absent when the provider has never been tested. */
	status?: ProviderStatus;
	latencyMs?: number;
	lastCheckedAt?: number;
	statusMessage?: string;
	createdAt: number;
	updatedAt: number;
}

/** Input for creating a provider config. */
export interface ProviderConfigInput {
	name: string;
	type: ProviderType;
	baseUrl: string;
	apiToken: string;
	defaultModel?: string;
	streaming?: boolean;
}

/** Input for updating a provider config. */
export interface ProviderConfigUpdate {
	name?: string;
	type?: ProviderType;
	baseUrl?: string;
	apiToken?: string;
	defaultModel?: string;
	streaming?: boolean;
}

/** A conversation stored in the database. */
export interface Conversation {
	id: string;
	userId: string;
	title: string;
	model?: string;
	providerConfigId?: string;
	pinned: boolean;
	favorited: boolean;
	createdAt: number;
	updatedAt: number;
}

/** A single message snippet used for list previews. */
export interface MessagePreviewSnippet {
	content: string;
	createdAt: number;
}

/** Preview snippets for a conversation, used in sidebar list views. */
export interface MessagePreview {
	firstUser?: MessagePreviewSnippet;
	lastAssistant?: MessagePreviewSnippet;
}

/** A conversation summary for list views. */
export interface ConversationSummary {
	id: string;
	title: string;
	model?: string;
	providerConfigId?: string;
	pinned: boolean;
	favorited: boolean;
	updatedAt: number;
	preview?: MessagePreview;
}

/** Input for creating a conversation. */
export interface ConversationInput {
	title?: string;
	model?: string;
	providerConfigId?: string;
}

/** Input for updating a conversation. */
export interface ConversationUpdate {
	title?: string;
	model?: string;
	providerConfigId?: string | null;
	pinned?: boolean;
	favorited?: boolean;
}

/** A message stored in the database. */
export interface StoredMessage {
	id: string;
	conversationId: string;
	role: "system" | "user" | "assistant";
	content: string;
	model?: string;
	reasoning?: string;
	tokensPrompt?: number;
	tokensCompletion?: number;
	tokensTotal?: number;
	createdAt: number;
}

/** Input for creating a message. */
export interface MessageInput {
	conversationId: string;
	role: "system" | "user" | "assistant";
	content: string;
	model?: string;
	reasoning?: string;
	tokensPrompt?: number;
	tokensCompletion?: number;
	tokensTotal?: number;
}

/** Input for updating a message. */
export interface MessageUpdate {
	content: string;
}

/** Input for the streaming message endpoint. */
export interface StreamMessageInput {
	content: string;
	model?: string | undefined;
	providerConfigId?: string | undefined;
	regenerate?: boolean | undefined;
	/** Assistant message to replace (regenerate). Deleted server-side only after
	 * the new response is successfully generated. */
	replaceMessageId?: string | undefined;
	/** When editing a user message, all messages after this one are excluded
	 * from context and deleted server-side after the new response succeeds. */
	deleteAfterMessageId?: string | undefined;
}

/** Token usage reported by the provider. */
export interface TokenUsage {
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
}

/** SSE event emitted by the streaming message endpoint. */
export type StreamChatEvent =
	| { type: "meta"; messageId: string; model: string }
	| { type: "delta"; content: string }
	| { type: "reasoning"; content: string }
	| { type: "done"; messageId: string; usage?: TokenUsage }
	| { type: "error"; message: string };
