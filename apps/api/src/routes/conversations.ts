import type {
	Conversation,
	ConversationSummary,
	MessagePreview,
	StoredMessage,
	StreamChatEvent,
} from "@katto/sdk/chat";
import { and, asc, count, desc, eq, gt, inArray, max, min } from "drizzle-orm";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { createDb } from "../../db/index.js";
import { conversations, messages, providerModels } from "../../db/schema.js";
import { decryptSecret } from "../lib/crypto.js";
import {
	type CompletionResult,
	completeChat,
	completeChatStream,
} from "../lib/provider-complete.js";
import { resolveProviderConfig } from "../lib/provider-resolve.js";
import {
	conversationCreateSchema,
	conversationUpdateSchema,
	messageCreateSchema,
	messageUpdateSchema,
	streamMessageSchema,
	validateBody,
} from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";
import type { Env, Variables } from "../types.js";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", requireAuth);

function toConversation(row: typeof conversations.$inferSelect): Conversation {
	const conversation: Conversation = {
		id: row.id,
		userId: row.userId,
		title: row.title,
		pinned: row.pinned === 1,
		favorited: row.favorited === 1,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
	if (row.model !== null) {
		conversation.model = row.model;
	}
	if (row.providerConfigId !== null) {
		conversation.providerConfigId = row.providerConfigId;
	}
	return conversation;
}

function toSummary(
	row: typeof conversations.$inferSelect,
	preview?: MessagePreview,
): ConversationSummary {
	const summary: ConversationSummary = {
		id: row.id,
		title: row.title,
		pinned: row.pinned === 1,
		favorited: row.favorited === 1,
		updatedAt: row.updatedAt,
	};
	if (row.model !== null) {
		summary.model = row.model;
	}
	if (row.providerConfigId !== null) {
		summary.providerConfigId = row.providerConfigId;
	}
	if (preview !== undefined) {
		summary.preview = preview;
	}
	return summary;
}

function toMessage(row: typeof messages.$inferSelect): StoredMessage {
	const message: StoredMessage = {
		id: row.id,
		conversationId: row.conversationId,
		role: row.role,
		content: row.content,
		createdAt: row.createdAt,
	};
	if (row.model !== null) {
		message.model = row.model;
	}
	if (row.reasoning !== null) {
		message.reasoning = row.reasoning;
	}
	if (row.tokensPrompt !== null) {
		message.tokensPrompt = row.tokensPrompt;
	}
	if (row.tokensCompletion !== null) {
		message.tokensCompletion = row.tokensCompletion;
	}
	if (row.tokensTotal !== null) {
		message.tokensTotal = row.tokensTotal;
	}
	return message;
}

const PREVIEW_SNIPPET_LIMIT = 80;
const AUTO_TITLE_LIMIT = 50;
const DEFAULT_TITLE = "New Chat";

function truncate(text: string, limit: number): string {
	if (text.length <= limit) return text;
	return `${text.slice(0, limit).trimEnd()}…`;
}

function cleanTitle(raw: string, limit: number): string {
	const trimmed = raw
		.trim()
		.replace(/^["'`]+|["'`]+$/g, "")
		.replace(/\s+/g, " ")
		.trim();
	if (trimmed.length === 0) return "";
	return truncate(trimmed, limit);
}

async function fetchPreviews(
	db: ReturnType<typeof createDb>,
	conversationIds: string[],
): Promise<Map<string, MessagePreview>> {
	const map = new Map<string, MessagePreview>();
	if (conversationIds.length === 0) return map;

	const firstUserRows = await db
		.select({
			conversationId: messages.conversationId,
			createdAt: min(messages.createdAt),
			content: messages.content,
		})
		.from(messages)
		.where(and(inArray(messages.conversationId, conversationIds), eq(messages.role, "user")))
		.groupBy(messages.conversationId);

	for (const row of firstUserRows) {
		if (row.createdAt === null) continue;
		map.set(row.conversationId, {
			firstUser: {
				content: truncate(row.content, PREVIEW_SNIPPET_LIMIT),
				createdAt: row.createdAt,
			},
		});
	}

	const lastAssistantRows = await db
		.select({
			conversationId: messages.conversationId,
			createdAt: max(messages.createdAt),
			content: messages.content,
		})
		.from(messages)
		.where(and(inArray(messages.conversationId, conversationIds), eq(messages.role, "assistant")))
		.groupBy(messages.conversationId);

	for (const row of lastAssistantRows) {
		if (row.createdAt === null) continue;
		const existing = map.get(row.conversationId) ?? {};
		existing.lastAssistant = {
			content: truncate(row.content, PREVIEW_SNIPPET_LIMIT),
			createdAt: row.createdAt,
		};
		map.set(row.conversationId, existing);
	}

	return map;
}

app.get("/", async (c) => {
	const userId = c.get("userId");
	const db = createDb(c.env.DB);

	const rows = await db
		.select()
		.from(conversations)
		.where(eq(conversations.userId, userId))
		.orderBy(desc(conversations.updatedAt));

	const previews = await fetchPreviews(
		db,
		rows.map((r) => r.id),
	);

	return c.json({
		conversations: rows.map((r) => toSummary(r, previews.get(r.id))),
	});
});

app.post("/", async (c) => {
	const userId = c.get("userId");
	const result = await validateBody(c, conversationCreateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const db = createDb(c.env.DB);
	const now = Date.now();

	const [created] = await db
		.insert(conversations)
		.values({
			id: crypto.randomUUID(),
			userId,
			title: data.title ?? "New Chat",
			model: data.model ?? null,
			providerConfigId: data.providerConfigId ?? null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	if (!created) {
		return c.json({ error: "Failed to create conversation" }, 500);
	}

	return c.json(toConversation(created), 201);
});

app.patch("/:id", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const result = await validateBody(c, conversationUpdateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const db = createDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	const now = Date.now();
	const [updated] = await db
		.update(conversations)
		.set({
			updatedAt: now,
			...(data.title !== undefined && { title: data.title }),
			...(data.model !== undefined && { model: data.model }),
			...(data.pinned !== undefined && { pinned: data.pinned ? 1 : 0 }),
			...(data.favorited !== undefined && { favorited: data.favorited ? 1 : 0 }),
			...(data.providerConfigId !== undefined && {
				providerConfigId: data.providerConfigId,
			}),
		})
		.where(eq(conversations.id, id))
		.returning();

	if (!updated) {
		return c.json({ error: "Failed to update conversation" }, 500);
	}

	return c.json(toConversation(updated), 200);
});

app.delete("/:id", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const db = createDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	// Messages cascade-delete via onDelete: cascade in schema.
	await db
		.delete(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

	return c.body(null, 204);
});

app.get("/:id/messages", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const db = createDb(c.env.DB);

	const [existing] = await db
		.select({ id: conversations.id })
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	const rows = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, id))
		.orderBy(asc(messages.createdAt));

	return c.json({ messages: rows.map(toMessage) });
});

app.post("/:id/messages", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const result = await validateBody(c, messageCreateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const db = createDb(c.env.DB);

	const [existing] = await db
		.select({ id: conversations.id, title: conversations.title })
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	const now = Date.now();

	const [created] = await db
		.insert(messages)
		.values({
			id: crypto.randomUUID(),
			conversationId: id,
			role: data.role,
			content: data.content,
			model: data.model ?? null,
			tokensPrompt: data.tokensPrompt ?? null,
			tokensCompletion: data.tokensCompletion ?? null,
			tokensTotal: data.tokensTotal ?? null,
			createdAt: now,
		})
		.returning();

	if (!created) {
		return c.json({ error: "Failed to create message" }, 500);
	}

	let autoTitle: string | undefined;
	if (data.role === "user" && existing.title === DEFAULT_TITLE) {
		const [countRow] = await db
			.select({ n: count() })
			.from(messages)
			.where(and(eq(messages.conversationId, id), eq(messages.role, "user")));
		if ((countRow?.n ?? 0) === 1) {
			autoTitle = truncate(data.content, AUTO_TITLE_LIMIT);
		}
	}

	await db
		.update(conversations)
		.set({
			updatedAt: now,
			...(autoTitle !== undefined && { title: autoTitle }),
		})
		.where(eq(conversations.id, id));

	return c.json(toMessage(created), 201);
});

app.patch("/:id/messages/:messageId", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const messageId = c.req.param("messageId");
	const result = await validateBody(c, messageUpdateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const { content } = result.data;

	const db = createDb(c.env.DB);

	const [conv] = await db
		.select({ id: conversations.id })
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!conv) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	const [updated] = await db
		.update(messages)
		.set({ content })
		.where(and(eq(messages.id, messageId), eq(messages.conversationId, id)))
		.returning();

	if (!updated) {
		return c.json({ error: "Message not found" }, 404);
	}

	return c.json(toMessage(updated), 200);
});

app.delete("/:id/messages/:messageId", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const messageId = c.req.param("messageId");
	const db = createDb(c.env.DB);

	const [conv] = await db
		.select({ id: conversations.id })
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!conv) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	await db.delete(messages).where(and(eq(messages.id, messageId), eq(messages.conversationId, id)));

	return c.body(null, 204);
});

app.post("/:id/generate-title", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const db = createDb(c.env.DB);

	const [conv] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!conv) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	const resolved = await resolveProviderConfig(db, userId, conv);
	if (!resolved) {
		return c.json({ title: conv.title, generated: false });
	}

	const { config, model } = resolved;

	const [firstUser] = await db
		.select()
		.from(messages)
		.where(and(eq(messages.conversationId, id), eq(messages.role, "user")))
		.orderBy(asc(messages.createdAt))
		.limit(1);

	if (!firstUser) {
		return c.json({ title: conv.title, generated: false });
	}

	const autoTitle = truncate(firstUser.content, AUTO_TITLE_LIMIT);
	if (conv.title !== DEFAULT_TITLE && conv.title !== autoTitle) {
		return c.json({ title: conv.title, generated: false });
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10_000);

	try {
		const raw = await completeChat({
			type: config.type,
			baseUrl: config.baseUrl,
			apiToken: await decryptSecret(config.apiToken, c.env),
			model,
			systemPrompt:
				"Generate a concise title (at most 6 words) for this conversation. Reply with the title only — no quotes, no trailing punctuation.",
			messages: [{ role: "user", content: firstUser.content }],
			maxTokens: 20,
			signal: controller.signal,
		});

		const title = cleanTitle(raw.content, AUTO_TITLE_LIMIT);
		if (!title) {
			return c.json({ title: conv.title, generated: false });
		}

		await db
			.update(conversations)
			.set({ title, updatedAt: Date.now() })
			.where(eq(conversations.id, id));

		return c.json({ title, generated: true });
	} catch {
		return c.json({ title: conv.title, generated: false });
	} finally {
		clearTimeout(timer);
	}
});

/**
 * Deletes messages that are being replaced or superseded after a successful
 * regeneration or edit. Called only after the new assistant message is
 * persisted, so a generation failure preserves the original messages.
 */
async function cleanupReplacedMessages(
	db: ReturnType<typeof createDb>,
	conversationId: string,
	replaceMessageId: string | undefined,
	deleteAfterTimestamp: number | null,
) {
	if (replaceMessageId) {
		await db
			.delete(messages)
			.where(and(eq(messages.id, replaceMessageId), eq(messages.conversationId, conversationId)));
	}
	if (deleteAfterTimestamp !== null) {
		await db
			.delete(messages)
			.where(
				and(
					eq(messages.conversationId, conversationId),
					gt(messages.createdAt, deleteAfterTimestamp),
				),
			);
	}
}

app.post("/:id/messages/stream", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const result = await validateBody(c, streamMessageSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const {
		content,
		model: reqModel,
		providerConfigId: reqProviderConfigId,
		regenerate,
		replaceMessageId,
		deleteAfterMessageId,
	} = result.data;

	const db = createDb(c.env.DB);

	const [conv] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
		.limit(1);

	if (!conv) {
		return c.json({ error: "Conversation not found" }, 404);
	}

	const resolved = await resolveProviderConfig(db, userId, {
		...conv,
		model: reqModel ?? conv.model,
		providerConfigId: reqProviderConfigId ?? conv.providerConfigId,
	});
	if (!resolved) {
		return c.json({ error: "No provider configured" }, 400);
	}

	const { config, model } = resolved;

	// Persist resolved model + provider so the conversation remembers the last
	// model used — not just the config default. Covers the case where a
	// conversation was created without an explicit model selection.
	if (conv.model !== model || conv.providerConfigId !== config.id) {
		await db
			.update(conversations)
			.set({ model, providerConfigId: config.id })
			.where(eq(conversations.id, id));
	}

	const [modelRow] = await db
		.select({ reasoning: providerModels.reasoning })
		.from(providerModels)
		.where(and(eq(providerModels.providerConfigId, config.id), eq(providerModels.modelId, model)))
		.limit(1);
	const showReasoning = (modelRow?.reasoning ?? 0) === 1;

	const now = Date.now();
	const assistantMessageId = crypto.randomUUID();

	if (!regenerate) {
		await db.insert(messages).values({
			id: crypto.randomUUID(),
			conversationId: id,
			role: "user",
			content: content ?? "",
			createdAt: now,
		});

		let autoTitle: string | undefined;
		if (conv.title === DEFAULT_TITLE) {
			const [countRow] = await db
				.select({ n: count() })
				.from(messages)
				.where(and(eq(messages.conversationId, id), eq(messages.role, "user")));
			if ((countRow?.n ?? 0) === 1) {
				autoTitle = truncate(content ?? "", AUTO_TITLE_LIMIT);
			}
		}

		await db
			.update(conversations)
			.set({
				updatedAt: now,
				...(autoTitle !== undefined && { title: autoTitle }),
			})
			.where(eq(conversations.id, id));
	}

	const allMessages = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, id))
		.orderBy(asc(messages.createdAt));

	// When regenerating, exclude the old assistant message from context.
	// When editing, exclude all messages after the edited message from context.
	// The actual DB deletion happens only after the new response is successfully
	// generated, so a failure preserves the original messages.
	let contextMessages = allMessages;
	let deleteAfterTimestamp: number | null = null;
	if (deleteAfterMessageId) {
		const edited = allMessages.find((m) => m.id === deleteAfterMessageId);
		if (edited) deleteAfterTimestamp = edited.createdAt;
	}
	contextMessages = allMessages.filter((m) => {
		if (replaceMessageId && m.id === replaceMessageId) return false;
		if (deleteAfterTimestamp !== null && m.createdAt > deleteAfterTimestamp) return false;
		return true;
	});

	const chatMessages = contextMessages
		.filter((m) => m.role === "user" || m.role === "assistant")
		.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

	const upstreamController = new AbortController();

	return streamSSE(c, async (stream) => {
		stream.onAbort(() => upstreamController.abort());

		const metaEvent: StreamChatEvent = {
			type: "meta",
			messageId: assistantMessageId,
			model,
		};
		await stream.writeSSE({ data: JSON.stringify(metaEvent) });

		if (config.streaming === 0) {
			try {
				const result: CompletionResult = await completeChat({
					type: config.type,
					baseUrl: config.baseUrl,
					apiToken: await decryptSecret(config.apiToken, c.env),
					model,
					messages: chatMessages,
					maxTokens: 4096,
					signal: upstreamController.signal,
				});

				if (showReasoning && result.reasoning) {
					const reasoningEvent: StreamChatEvent = {
						type: "reasoning",
						content: result.reasoning,
					};
					await stream.writeSSE({ data: JSON.stringify(reasoningEvent) });
				}

				const deltaEvent: StreamChatEvent = { type: "delta", content: result.content };
				await stream.writeSSE({ data: JSON.stringify(deltaEvent) });

				await db.insert(messages).values({
					id: assistantMessageId,
					conversationId: id,
					role: "assistant",
					content: result.content,
					model,
					reasoning: showReasoning ? (result.reasoning ?? null) : null,
					createdAt: Date.now(),
				});

				await cleanupReplacedMessages(db, id, replaceMessageId, deleteAfterTimestamp);

				await db
					.update(conversations)
					.set({ updatedAt: Date.now() })
					.where(eq(conversations.id, id));

				const doneEvent: StreamChatEvent = {
					type: "done",
					messageId: assistantMessageId,
				};
				await stream.writeSSE({ data: JSON.stringify(doneEvent) });
			} catch (err) {
				const message = err instanceof Error ? err.message : "Provider request failed";
				const errorEvent: StreamChatEvent = { type: "error", message };
				await stream.writeSSE({ data: JSON.stringify(errorEvent) });
			}
			return;
		}

		let accumulated = "";
		let reasoningAccumulated = "";
		let usage:
			| { promptTokens?: number; completionTokens?: number; totalTokens?: number }
			| undefined;
		let hadError = false;

		try {
			for await (const chunk of completeChatStream({
				type: config.type,
				baseUrl: config.baseUrl,
				apiToken: await decryptSecret(config.apiToken, c.env),
				model,
				messages: chatMessages,
				signal: upstreamController.signal,
			})) {
				if (chunk.type === "content" && chunk.content) {
					accumulated += chunk.content;
					const deltaEvent: StreamChatEvent = {
						type: "delta",
						content: chunk.content,
					};
					await stream.writeSSE({ data: JSON.stringify(deltaEvent) });
				} else if (chunk.type === "reasoning" && chunk.content && showReasoning) {
					reasoningAccumulated += chunk.content;
					const reasoningEvent: StreamChatEvent = {
						type: "reasoning",
						content: chunk.content,
					};
					await stream.writeSSE({ data: JSON.stringify(reasoningEvent) });
				} else if (chunk.type === "usage" && chunk.usage) {
					usage = chunk.usage;
				} else if (chunk.type === "error") {
					hadError = true;
					const errorEvent: StreamChatEvent = {
						type: "error",
						message: chunk.error ?? "Unknown error",
					};
					await stream.writeSSE({ data: JSON.stringify(errorEvent) });
					break;
				} else if (chunk.type === "done") {
					break;
				}
			}
		} catch (err) {
			if (accumulated.length === 0) {
				const message = err instanceof Error ? err.message : "Provider request failed";
				const errorEvent: StreamChatEvent = {
					type: "error",
					message,
				};
				await stream.writeSSE({ data: JSON.stringify(errorEvent) });
				return;
			}
		}

		if (accumulated.length > 0) {
			await db.insert(messages).values({
				id: assistantMessageId,
				conversationId: id,
				role: "assistant",
				content: accumulated,
				model,
				reasoning: reasoningAccumulated || null,
				tokensPrompt: usage?.promptTokens ?? null,
				tokensCompletion: usage?.completionTokens ?? null,
				tokensTotal: usage?.totalTokens ?? null,
				createdAt: Date.now(),
			});

			await cleanupReplacedMessages(db, id, replaceMessageId, deleteAfterTimestamp);

			await db.update(conversations).set({ updatedAt: Date.now() }).where(eq(conversations.id, id));
		}

		if (!hadError) {
			const doneEvent: StreamChatEvent = {
				type: "done",
				messageId: assistantMessageId,
				...(usage !== undefined && { usage }),
			};
			await stream.writeSSE({ data: JSON.stringify(doneEvent) });
		}
	});
});

export { app as conversationsRoute };
