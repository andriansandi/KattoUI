import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const providerConfigs = sqliteTable("provider_configs", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	type: text("type", { enum: ["openai", "anthropic", "custom"] })
		.notNull()
		.default("openai"),
	baseUrl: text("base_url").notNull(),
	apiToken: text("api_token").notNull(),
	defaultModel: text("default_model"),
	status: text("status", { enum: ["healthy", "degraded", "unhealthy"] }),
	latencyMs: integer("latency_ms"),
	lastCheckedAt: integer("last_checked_at"),
	statusMessage: text("status_message"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const conversations = sqliteTable("conversations", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	title: text("title").notNull().default("New Chat"),
	model: text("model"),
	providerConfigId: text("provider_config_id").references(() => providerConfigs.id),
	pinned: integer("pinned").notNull().default(0),
	favorited: integer("favorited").notNull().default(0),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const messages = sqliteTable(
	"messages",
	{
		id: text("id").primaryKey(),
		conversationId: text("conversation_id")
			.notNull()
			.references(() => conversations.id, { onDelete: "cascade" }),
		role: text("role", { enum: ["system", "user", "assistant"] }).notNull(),
		content: text("content").notNull(),
		model: text("model"),
		tokensPrompt: integer("tokens_prompt"),
		tokensCompletion: integer("tokens_completion"),
		tokensTotal: integer("tokens_total"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [index("messages_conversation_id_idx").on(table.conversationId)],
);
