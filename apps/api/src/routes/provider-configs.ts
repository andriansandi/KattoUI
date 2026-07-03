import type { ProviderConfig, ProviderType } from "@katto/sdk/chat";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDb } from "../../db/index.js";
import { conversations, providerConfigs } from "../../db/schema.js";
import {
	providerConfigCreateSchema,
	providerConfigTestSchema,
	providerConfigUpdateSchema,
	validateBody,
} from "../lib/validation.js";
import { requireAuth } from "../middleware/auth.js";
import type { Env, Variables } from "../types.js";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Protect every route in this sub-app — covers `/`, `/:id`, and `/test`.
app.use("*", requireAuth);

/** Per-type request shape. The models path is shared; auth differs. */
interface ProviderSpec {
	modelsPath: string;
	buildHeaders: (token: string) => Record<string, string>;
}

const PROVIDER_SPECS: Record<ProviderType, ProviderSpec> = {
	openai: {
		modelsPath: "/models",
		buildHeaders: (token) => (token ? { Authorization: `Bearer ${token}` } : {}),
	},
	anthropic: {
		modelsPath: "/models",
		buildHeaders: (token) =>
			token
				? { "x-api-key": token, "anthropic-version": "2023-06-01" }
				: { "anthropic-version": "2023-06-01" },
	},
	custom: {
		modelsPath: "/models",
		buildHeaders: (token) => (token ? { Authorization: `Bearer ${token}` } : {}),
	},
};

/** Maps a stored row to the masked SDK shape — `apiToken` is never exposed. */
function toProviderConfig(row: typeof providerConfigs.$inferSelect): ProviderConfig {
	const config: ProviderConfig = {
		id: row.id,
		userId: row.userId,
		name: row.name,
		type: row.type,
		baseUrl: row.baseUrl,
		isConfigured: row.apiToken !== "",
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
	if (row.defaultModel !== null) {
		config.defaultModel = row.defaultModel;
	}
	return config;
}

app.get("/", async (c) => {
	const userId = c.get("userId");
	const db = createDb(c.env.DB);

	const rows = await db.select().from(providerConfigs).where(eq(providerConfigs.userId, userId));

	return c.json({ providerConfigs: rows.map(toProviderConfig) });
});

app.post("/", async (c) => {
	const userId = c.get("userId");
	const result = await validateBody(c, providerConfigCreateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const db = createDb(c.env.DB);
	const now = Date.now();

	const [created] = await db
		.insert(providerConfigs)
		.values({
			id: crypto.randomUUID(),
			userId,
			name: data.name,
			type: data.type,
			baseUrl: data.baseUrl,
			apiToken: data.apiToken ?? "",
			defaultModel: data.defaultModel || null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	if (!created) {
		return c.json({ error: "Failed to create provider config" }, 500);
	}

	return c.json(toProviderConfig(created), 201);
});

app.patch("/:id", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const result = await validateBody(c, providerConfigUpdateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const db = createDb(c.env.DB);

	// Verify ownership before mutating.
	const [existing] = await db
		.select()
		.from(providerConfigs)
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Provider config not found" }, 404);
	}

	const now = Date.now();
	const [updated] = await db
		.update(providerConfigs)
		.set({
			updatedAt: now,
			...(data.name !== undefined && { name: data.name }),
			...(data.type !== undefined && { type: data.type }),
			...(data.baseUrl !== undefined && { baseUrl: data.baseUrl }),
			// An empty/omitted token means "keep existing" — never overwrite with "".
			...(data.apiToken !== undefined &&
				data.apiToken !== "" && {
					apiToken: data.apiToken,
				}),
			...(data.defaultModel !== undefined && {
				defaultModel: data.defaultModel || null,
			}),
		})
		.where(eq(providerConfigs.id, id))
		.returning();

	if (!updated) {
		return c.json({ error: "Failed to update provider config" }, 500);
	}

	return c.json(toProviderConfig(updated), 200);
});

app.delete("/:id", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const db = createDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(providerConfigs)
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Provider config not found" }, 404);
	}

	// Nullify references on conversations, then delete — atomic in one D1 batch.
	await db.batch([
		db
			.update(conversations)
			.set({ providerConfigId: null })
			.where(and(eq(conversations.providerConfigId, id), eq(conversations.userId, userId))),
		db
			.delete(providerConfigs)
			.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId))),
	]);

	return c.body(null, 204);
});

app.post("/test", async (c) => {
	const result = await validateBody(c, providerConfigTestSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 8000);
	const token = data.apiToken ?? "";
	const spec = PROVIDER_SPECS[data.type];

	try {
		const response = await fetch(`${data.baseUrl.replace(/\/$/, "")}${spec.modelsPath}`, {
			headers: spec.buildHeaders(token),
			signal: controller.signal,
		});

		if (!response.ok) {
			return c.json({
				ok: false,
				error: `Provider responded ${response.status} ${response.statusText}`,
			});
		}

		const json = (await response.json()) as { data?: Array<{ id?: string }> };
		const models = Array.isArray(json.data)
			? json.data.map((m) => m?.id).filter((id): id is string => typeof id === "string")
			: [];

		return c.json({ ok: true, models });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return c.json({ ok: false, error: message });
	} finally {
		clearTimeout(timer);
	}
});

export { app as providerConfigsRoute };
