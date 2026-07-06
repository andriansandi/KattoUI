import type {
	ProviderConfig,
	ProviderModelEntry,
	ProviderModelGroup,
	ProviderStatus,
	ProviderType,
} from "@katto/sdk/chat";
import { getModelDisplayName } from "@katto/sdk/model-names";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDb } from "../../db/index.js";
import { conversations, providerConfigs, providerModels } from "../../db/schema.js";
import { decryptSecret, encryptSecret } from "../lib/crypto.js";
import {
	providerConfigCreateSchema,
	providerConfigTestSchema,
	providerConfigUpdateSchema,
	providerModelCreateSchema,
	providerModelsUpdateSchema,
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

const HEALTH_CHECK_TIMEOUT_MS = 8000;
const DEGRADED_LATENCY_THRESHOLD_MS = 3000;

interface HealthCheckResult {
	status: ProviderStatus;
	latencyMs: number;
	message: string;
	models: string[];
}

/**
 * Fetches the provider's `/models` endpoint with a timeout and classifies the
 * result. `healthy` = responded 2xx quickly; `degraded` = responded 2xx but
 * slowly; `unhealthy` = non-2xx, timeout, or network error. Shared by the
 * pre-save test, the saved-config test, and background post-save validation.
 *
 * When `/models` fails and a `defaultModel` is provided, falls back to a
 * minimal `/chat/completions` request — needed for providers like Cloudflare
 * Workers AI that don't expose a `/models` endpoint.
 */
async function runHealthCheck(args: {
	type: ProviderType;
	baseUrl: string;
	token: string;
	defaultModel?: string | undefined;
}): Promise<HealthCheckResult> {
	const spec = PROVIDER_SPECS[args.type];
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
	const start = Date.now();
	try {
		const origin = args.baseUrl.replace(/\/$/, "");
		const response = await fetch(`${origin}${spec.modelsPath}`, {
			headers: spec.buildHeaders(args.token),
			signal: controller.signal,
		});
		const latencyMs = Date.now() - start;
		if (!response.ok) {
			// Fallback: try a minimal streaming chat completion for providers
			// without /models (e.g. Cloudflare Workers AI). Using stream:true
			// avoids timeouts on reasoning models that hang on non-streaming.
			if (args.defaultModel) {
				const chatRes = await fetch(`${origin}/chat/completions`, {
					method: "POST",
					headers: { "Content-Type": "application/json", ...spec.buildHeaders(args.token) },
					body: JSON.stringify({
						model: args.defaultModel,
						messages: [{ role: "user", content: "hi" }],
						max_tokens: 1,
						stream: true,
					}),
					signal: controller.signal,
				});
				const chatLatencyMs = Date.now() - start;
				if (chatRes.ok) {
					return {
						status: chatLatencyMs >= DEGRADED_LATENCY_THRESHOLD_MS ? "degraded" : "healthy",
						latencyMs: chatLatencyMs,
						message: "OK",
						models: [],
					};
				}
			}
			return {
				status: "unhealthy",
				latencyMs,
				message: `Responded ${response.status} ${response.statusText}`,
				models: [],
			};
		}
		const json = (await response.json()) as { data?: Array<{ id?: string }> };
		const models = Array.isArray(json.data)
			? json.data.map((m) => m?.id).filter((m): m is string => typeof m === "string")
			: [];
		return {
			status: latencyMs >= DEGRADED_LATENCY_THRESHOLD_MS ? "degraded" : "healthy",
			latencyMs,
			message: "OK",
			models,
		};
	} catch (error) {
		const latencyMs = Date.now() - start;
		const message = error instanceof Error ? error.message : "Unknown error";
		return { status: "unhealthy", latencyMs, message, models: [] };
	} finally {
		clearTimeout(timer);
	}
}

/** Persists a health-check result onto a provider config row. */
async function persistHealth(
	db: ReturnType<typeof createDb>,
	id: string,
	userId: string,
	result: HealthCheckResult,
): Promise<void> {
	await db
		.update(providerConfigs)
		.set({
			status: result.status,
			latencyMs: result.latencyMs,
			lastCheckedAt: Date.now(),
			statusMessage: result.message,
			updatedAt: Date.now(),
		})
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)));
}

/** Maps a stored row to the masked SDK shape — `apiToken` is never exposed. */
function toProviderConfig(row: typeof providerConfigs.$inferSelect): ProviderConfig {
	const config: ProviderConfig = {
		id: row.id,
		userId: row.userId,
		name: row.name,
		type: row.type,
		baseUrl: row.baseUrl,
		isConfigured: row.apiToken !== "",
		streaming: row.streaming === 1,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
	if (row.defaultModel !== null) {
		config.defaultModel = row.defaultModel;
	}
	if (row.status !== null) {
		config.status = row.status;
	}
	if (row.latencyMs !== null) {
		config.latencyMs = row.latencyMs;
	}
	if (row.lastCheckedAt !== null) {
		config.lastCheckedAt = row.lastCheckedAt;
	}
	if (row.statusMessage !== null) {
		config.statusMessage = row.statusMessage;
	}
	return config;
}

/** Maps a stored provider-model row to the SDK catalog entry shape. */
function toEntry(row: typeof providerModels.$inferSelect): ProviderModelEntry {
	return {
		id: row.modelId,
		name: row.name,
		enabled: row.enabled === 1,
		reasoning: row.reasoning === 1,
	};
}

app.get("/", async (c) => {
	const userId = c.get("userId");
	const db = createDb(c.env.DB);

	const rows = await db.select().from(providerConfigs).where(eq(providerConfigs.userId, userId));

	return c.json({ providerConfigs: rows.map(toProviderConfig) });
});

/**
 * Returns enabled models across all of the user's provider configs, grouped by
 * config. Powers the single grouped model selector in chat. Registered before
 * the `/:id` routes so the literal `/models` segment isn't captured as an id.
 */
app.get("/models", async (c) => {
	const userId = c.get("userId");
	const db = createDb(c.env.DB);

	const rows = await db
		.select({
			providerConfigId: providerModels.providerConfigId,
			providerName: providerConfigs.name,
			modelId: providerModels.modelId,
			modelName: providerModels.name,
		})
		.from(providerModels)
		.innerJoin(providerConfigs, eq(providerModels.providerConfigId, providerConfigs.id))
		.where(and(eq(providerConfigs.userId, userId), eq(providerModels.enabled, 1)))
		.orderBy(asc(providerConfigs.name), asc(providerModels.name));

	const groups: ProviderModelGroup[] = [];
	const byConfig = new Map<string, ProviderModelGroup>();
	for (const r of rows) {
		let g = byConfig.get(r.providerConfigId);
		if (!g) {
			g = { providerConfigId: r.providerConfigId, providerName: r.providerName, models: [] };
			byConfig.set(r.providerConfigId, g);
			groups.push(g);
		}
		g.models.push({ id: r.modelId, name: r.modelName });
	}

	return c.json({ groups });
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
			apiToken: await encryptSecret(data.apiToken ?? "", c.env),
			defaultModel: data.defaultModel || null,
			streaming: data.streaming !== undefined ? (data.streaming ? 1 : 0) : 1,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	if (!created) {
		return c.json({ error: "Failed to create provider config" }, 500);
	}

	// Best-effort background health validation — does not block the response.
	const plainToken = data.apiToken ?? "";
	c.executionCtx.waitUntil(
		(async () => {
			const bgDb = createDb(c.env.DB);
			const result = await runHealthCheck({
				type: created.type,
				baseUrl: created.baseUrl,
				token: plainToken,
				defaultModel: created.defaultModel ?? undefined,
			});
			await persistHealth(bgDb, created.id, userId, result);
		})(),
	);

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
	// An empty/omitted token means "keep existing" — never overwrite with "".
	// A non-empty token is encrypted before storage.
	const encryptedToken =
		data.apiToken !== undefined && data.apiToken !== ""
			? await encryptSecret(data.apiToken, c.env)
			: undefined;

	const [updated] = await db
		.update(providerConfigs)
		.set({
			updatedAt: now,
			...(data.name !== undefined && { name: data.name }),
			...(data.type !== undefined && { type: data.type }),
			...(data.baseUrl !== undefined && { baseUrl: data.baseUrl }),
			...(encryptedToken !== undefined && { apiToken: encryptedToken }),
			...(data.defaultModel !== undefined && {
				defaultModel: data.defaultModel || null,
			}),
			...(data.streaming !== undefined && { streaming: data.streaming ? 1 : 0 }),
		})
		.where(eq(providerConfigs.id, id))
		.returning();

	if (!updated) {
		return c.json({ error: "Failed to update provider config" }, 500);
	}

	// Background health validation only when connection-affecting fields
	// changed (type/baseUrl/apiToken). Name/defaultModel edits skip it.
	const connectionChanged =
		data.type !== undefined || data.baseUrl !== undefined || encryptedToken !== undefined;
	if (connectionChanged) {
		c.executionCtx.waitUntil(
			(async () => {
				const bgDb = createDb(c.env.DB);
				const token =
					encryptedToken !== undefined
						? (data.apiToken as string)
						: await decryptSecret(existing.apiToken, c.env);
				const result = await runHealthCheck({
					type: updated.type,
					baseUrl: updated.baseUrl,
					token,
					defaultModel: updated.defaultModel ?? undefined,
				});
				await persistHealth(bgDb, id, userId, result);
			})(),
		);
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

	const check = await runHealthCheck({
		type: data.type,
		baseUrl: data.baseUrl,
		token: data.apiToken ?? "",
		defaultModel: data.defaultModel,
	});

	return c.json({
		ok: check.status !== "unhealthy",
		status: check.status,
		latencyMs: check.latencyMs,
		message: check.message,
		models: check.models,
		...(check.status === "unhealthy" && { error: check.message }),
	});
});

/** Tests a saved provider config and persists the health result onto the row. */
app.post("/:id/test", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const db = createDb(c.env.DB);

	const [config] = await db
		.select()
		.from(providerConfigs)
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)))
		.limit(1);

	if (!config) {
		return c.json({ error: "Provider config not found" }, 404);
	}

	const token = await decryptSecret(config.apiToken, c.env);
	const check = await runHealthCheck({
		type: config.type,
		baseUrl: config.baseUrl,
		token,
		defaultModel: config.defaultModel ?? undefined,
	});
	await persistHealth(db, id, userId, check);

	return c.json({
		ok: check.status !== "unhealthy",
		status: check.status,
		latencyMs: check.latencyMs,
		message: check.message,
		models: check.models,
		...(check.status === "unhealthy" && { error: check.message }),
	});
});

app.get("/:id/models", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const db = createDb(c.env.DB);

	const [config] = await db
		.select()
		.from(providerConfigs)
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)))
		.limit(1);

	if (!config) {
		return c.json({ error: "Provider config not found" }, 404);
	}

	const rows = await db
		.select()
		.from(providerModels)
		.where(eq(providerModels.providerConfigId, id))
		.orderBy(asc(providerModels.name));

	return c.json({ models: rows.map(toEntry) });
});

/** Manually adds a model to a provider's catalog. */
app.post("/:id/models", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const result = await validateBody(c, providerModelCreateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const db = createDb(c.env.DB);

	const [config] = await db
		.select()
		.from(providerConfigs)
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)))
		.limit(1);

	if (!config) {
		return c.json({ error: "Provider config not found" }, 404);
	}

	const [existing] = await db
		.select()
		.from(providerModels)
		.where(and(eq(providerModels.providerConfigId, id), eq(providerModels.modelId, data.modelId)))
		.limit(1);

	if (existing) {
		return c.json({ error: "Model already exists in catalog" }, 409);
	}

	const now = Date.now();
	await db.insert(providerModels).values({
		id: crypto.randomUUID(),
		providerConfigId: id,
		modelId: data.modelId,
		name: data.name ?? getModelDisplayName(data.modelId),
		enabled: 1,
		createdAt: now,
		updatedAt: now,
	});

	const rows = await db
		.select()
		.from(providerModels)
		.where(eq(providerModels.providerConfigId, id))
		.orderBy(asc(providerModels.name));
	return c.json({ models: rows.map(toEntry) }, 201);
});

/** Removes a model from a provider's catalog. */
app.delete("/:id/models/:modelId", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const modelId = c.req.param("modelId");
	const db = createDb(c.env.DB);

	const [config] = await db
		.select()
		.from(providerConfigs)
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)))
		.limit(1);

	if (!config) {
		return c.json({ error: "Provider config not found" }, 404);
	}

	await db
		.delete(providerModels)
		.where(and(eq(providerModels.providerConfigId, id), eq(providerModels.modelId, modelId)));

	return c.body(null, 204);
});

/** Toggles enabled state on catalog models. Default model is set via PATCH /:id. */
app.patch("/:id/models", async (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const result = await validateBody(c, providerModelsUpdateSchema);
	if (!result.ok) return c.json({ error: result.message, issues: result.issues }, 400);
	const data = result.data;

	const db = createDb(c.env.DB);

	const [config] = await db
		.select()
		.from(providerConfigs)
		.where(and(eq(providerConfigs.id, id), eq(providerConfigs.userId, userId)))
		.limit(1);

	if (!config) {
		return c.json({ error: "Provider config not found" }, 404);
	}

	const now = Date.now();
	for (const m of data.models) {
		await db
			.update(providerModels)
			.set({
				enabled: m.enabled ? 1 : 0,
				...(m.reasoning !== undefined && { reasoning: m.reasoning ? 1 : 0 }),
				updatedAt: now,
			})
			.where(and(eq(providerModels.providerConfigId, id), eq(providerModels.modelId, m.id)));
	}

	const rows = await db
		.select()
		.from(providerModels)
		.where(eq(providerModels.providerConfigId, id))
		.orderBy(asc(providerModels.name));
	return c.json({ models: rows.map(toEntry) });
});

export { app as providerConfigsRoute };
