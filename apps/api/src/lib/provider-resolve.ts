import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { providerConfigs } from "../../db/schema.js";
import type { conversations, providerConfigs as providerConfigsType } from "../../db/schema.js";

export interface ResolvedProvider {
	config: typeof providerConfigsType.$inferSelect;
	model: string;
}

/**
 * Resolves the provider config and model for a conversation. If the
 * conversation has an explicit `providerConfigId`, that config is used;
 * otherwise falls back to the user's most recently created config. The model
 * is taken from the conversation's `model` field, or the config's
 * `defaultModel`.
 */
export async function resolveProviderConfig(
	db: Database,
	userId: string,
	conv: typeof conversations.$inferSelect,
): Promise<ResolvedProvider | null> {
	let config: typeof providerConfigsType.$inferSelect | null = null;

	if (conv.providerConfigId) {
		const [pc] = await db
			.select()
			.from(providerConfigs)
			.where(eq(providerConfigs.id, conv.providerConfigId))
			.limit(1);
		config = pc ?? null;
	} else {
		const [pc] = await db
			.select()
			.from(providerConfigs)
			.where(eq(providerConfigs.userId, userId))
			.orderBy(desc(providerConfigs.createdAt))
			.limit(1);
		config = pc ?? null;
	}

	if (!config) return null;

	const model = conv.model ?? config.defaultModel ?? null;
	if (!model) return null;

	return { config, model };
}
