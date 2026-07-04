import type { Conversation, ConversationSummary, StoredMessage } from "@katto/sdk/chat";
import { and, asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDb } from "../../db/index.js";
import { conversations, messages } from "../../db/schema.js";
import {
	conversationCreateSchema,
	conversationUpdateSchema,
	messageCreateSchema,
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

function toSummary(row: typeof conversations.$inferSelect): ConversationSummary {
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

app.get("/", async (c) => {
	const userId = c.get("userId");
	const db = createDb(c.env.DB);

	const rows = await db
		.select()
		.from(conversations)
		.where(eq(conversations.userId, userId))
		.orderBy(desc(conversations.updatedAt));

	return c.json({ conversations: rows.map(toSummary) });
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
		.select({ id: conversations.id })
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

	await db.update(conversations).set({ updatedAt: now }).where(eq(conversations.id, id));

	return c.json(toMessage(created), 201);
});

export { app as conversationsRoute };
