import type { Context } from "hono";
import { z } from "zod";

const providerTypeEnum = z.enum(["openai", "anthropic", "custom"]);

/**
 * Schemas for provider config requests. `apiToken` is optional (defaulting to
 * an empty string) so tokenless providers such as local Ollama are supported.
 */
export const providerConfigCreateSchema = z.object({
	name: z.string().min(1).max(100),
	type: providerTypeEnum,
	baseUrl: z.string().min(1).max(500),
	apiToken: z.string().max(1000).optional(),
	defaultModel: z.string().max(200).optional(),
});

export const providerConfigUpdateSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	type: providerTypeEnum.optional(),
	baseUrl: z.string().min(1).max(500).optional(),
	apiToken: z.string().max(1000).optional(),
	defaultModel: z.string().max(200).optional(),
});

export const providerConfigTestSchema = z.object({
	type: providerTypeEnum,
	baseUrl: z.string().min(1).max(500),
	apiToken: z.string().max(1000).optional(),
	defaultModel: z.string().max(200).optional(),
});

export const conversationCreateSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	model: z.string().max(200).optional(),
	providerConfigId: z.string().max(200).optional(),
});

export const conversationUpdateSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	model: z.string().max(200).optional(),
	pinned: z.boolean().optional(),
	favorited: z.boolean().optional(),
	providerConfigId: z.string().max(200).nullable().optional(),
});

export const messageCreateSchema = z.object({
	role: z.enum(["system", "user", "assistant"]),
	content: z.string().min(1).max(100_000),
	model: z.string().max(200).optional(),
	tokensPrompt: z.number().int().nonnegative().optional(),
	tokensCompletion: z.number().int().nonnegative().optional(),
	tokensTotal: z.number().int().nonnegative().optional(),
});

export type ProviderConfigCreate = z.infer<typeof providerConfigCreateSchema>;
export type ProviderConfigUpdate = z.infer<typeof providerConfigUpdateSchema>;
export type ProviderConfigTest = z.infer<typeof providerConfigTestSchema>;
export type ConversationCreate = z.infer<typeof conversationCreateSchema>;
export type ConversationUpdate = z.infer<typeof conversationUpdateSchema>;
export type MessageCreate = z.infer<typeof messageCreateSchema>;

export interface ValidationOk<T> {
	ok: true;
	data: T;
}

export interface ValidationFail {
	ok: false;
	message: string;
	issues?: Array<{ path: string; message: string }>;
}

export type ValidationResult<T> = ValidationOk<T> | ValidationFail;

/**
 * Parses a JSON request body against a zod schema. Returns a discriminated
 * result so callers build the error response themselves (no double-send).
 */
export async function validateBody<T>(
	c: Context,
	schema: z.ZodType<T>,
): Promise<ValidationResult<T>> {
	let json: unknown;
	try {
		json = await c.req.json();
	} catch {
		return { ok: false, message: "Invalid JSON body" };
	}

	const result = schema.safeParse(json);
	if (!result.success) {
		return {
			ok: false,
			message: "Validation failed",
			issues: result.error.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
			})),
		};
	}

	return { ok: true, data: result.data };
}
