/**
 * Friendly display-name resolution for model ids.
 *
 * Provider model ids are often raw machine identifiers such as
 * `@cf/zai-org/glm-4.7-flash` or `gpt-5-mini`. This module maps them to clean,
 * human-readable names for the UI. It mirrors the theme system's `id`/`name`
 * + `themesById` lookup pattern: a curated `KNOWN_MODEL_NAMES` map takes
 * priority, then `prettifyModelId` derives a readable name from the id.
 */

/** Curated display names for well-known model ids. */
export const KNOWN_MODEL_NAMES: Record<string, string> = {
	"gpt-4o": "GPT-4o",
	"gpt-4o-mini": "GPT-4o Mini",
	"gpt-4-turbo": "GPT-4 Turbo",
	"gpt-5": "GPT-5",
	"gpt-5-mini": "GPT-5 Mini",
	"claude-3-5-sonnet": "Claude 3.5 Sonnet",
	"claude-3-5-haiku": "Claude 3.5 Haiku",
	"claude-sonnet-5": "Claude Sonnet 5",
	"claude-opus-4": "Claude Opus 4",
	"llama-3.1-8b-instruct": "Llama 3.1 8B",
	"llama-3.1-70b-instruct": "Llama 3.1 70B",
};

const UPPERCASE_ACRONYMS = new Set([
	"glm",
	"gpt",
	"bge",
	"cli",
	"llm",
	"api",
	"sdk",
	"tts",
	"whisper",
]);

/**
 * Derives a readable name from a raw model id by stripping path prefixes,
 * splitting on `-`/`_`, and capitalizing each token. Version-like tokens
 * (starting with a digit) are preserved as-is; known acronyms are uppercased.
 */
export function prettifyModelId(id: string): string {
	const lastSegment = id.slice(id.lastIndexOf("/") + 1);
	if (!lastSegment) return id;
	const tokens = lastSegment.split(/[-_]/);
	const parts = tokens.map((token) => {
		if (!token) return token;
		if (UPPERCASE_ACRONYMS.has(token.toLowerCase())) {
			return token.toUpperCase();
		}
		if (/^\d/.test(token)) {
			return token;
		}
		return token.charAt(0).toUpperCase() + token.slice(1);
	});
	return parts.join(" ");
}

/** Returns the display name for a model id — known map first, then prettified. */
export function getModelDisplayName(id: string): string {
	return KNOWN_MODEL_NAMES[id] ?? prettifyModelId(id);
}
