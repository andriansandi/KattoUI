/** Supported provider types. */
export type ProviderType = "openai" | "anthropic" | "custom";

/** A provider configuration stored per user. */
export interface ProviderConfig {
	id: string;
	userId: string;
	name: string;
	type: ProviderType;
	baseUrl: string;
	defaultModel?: string;
	isConfigured: boolean;
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
}

/** Input for updating a provider config. */
export interface ProviderConfigUpdate {
	name?: string;
	type?: ProviderType;
	baseUrl?: string;
	apiToken?: string;
	defaultModel?: string;
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
	tokensPrompt?: number;
	tokensCompletion?: number;
	tokensTotal?: number;
}

/** Input for the streaming message endpoint. */
export interface StreamMessageInput {
	content: string;
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
	| { type: "done"; messageId: string; usage?: TokenUsage }
	| { type: "error"; message: string };
