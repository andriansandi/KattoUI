import type { Env } from "../types.js";

/**
 * AES-256-GCM encryption for secrets at rest.
 *
 * The key is a base64-encoded 32-byte value supplied via the `ENCRYPTION_KEY`
 * env binding (a Wrangler secret; `.dev.vars` locally). Generate one with:
 *
 *   openssl rand -base64 32
 *
 * Stored format: `v1:<base64-iv>:<base64-ciphertext>`. The `v1:` prefix makes
 * legacy plaintext values trivially detectable so they can be migrated lazily
 * and re-encrypted on the next write. An empty string is the tokenless sentinel
 * (e.g. local Ollama) and is never encrypted.
 */

const PREFIX = "v1:";
const IV_LENGTH = 12; // 96-bit IV — the AES-GCM recommendation.

let cachedKey: CryptoKey | null = null;
let cachedKeyMaterial = "";

/** True when `stored` is in the `v1:` encrypted format. */
export function isEncrypted(stored: string): boolean {
	return stored.startsWith(PREFIX);
}

/**
 * Encrypts a plaintext secret. Returns the empty string unchanged so tokenless
 * providers keep using `""` as their sentinel (and `isConfigured` stays correct).
 */
export async function encryptSecret(plaintext: string, env: Env): Promise<string> {
	if (plaintext === "") return "";
	const key = await getKey(env);
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encoded = new TextEncoder().encode(plaintext);
	const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
	return `${PREFIX}${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
}

/**
 * Decrypts a stored secret. Returns the empty string for tokenless providers.
 * Legacy plaintext values (no `v1:` prefix) are returned as-is so the system
 * keeps working while a one-time migration re-encrypts them.
 */
export async function decryptSecret(stored: string, env: Env): Promise<string> {
	if (stored === "") return "";
	if (!isEncrypted(stored)) return stored;
	const key = await getKey(env);
	const payload = stored.slice(PREFIX.length);
	const sep = payload.indexOf(":");
	if (sep === -1) throw new Error("Malformed encrypted secret");
	const iv = base64ToBytes(payload.slice(0, sep));
	const ciphertext = base64ToBytes(payload.slice(sep + 1));
	const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
	return new TextDecoder().decode(plaintext);
}

async function getKey(env: Env): Promise<CryptoKey> {
	const raw = env.ENCRYPTION_KEY;
	if (!raw) {
		throw new Error(
			"ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to .dev.vars (local) or `wrangler secret put ENCRYPTION_KEY` (remote).",
		);
	}
	if (cachedKey && cachedKeyMaterial === raw) return cachedKey;
	const bytes = base64ToBytes(raw);
	if (bytes.byteLength !== 32) {
		throw new Error(
			`ENCRYPTION_KEY must decode to 32 bytes (got ${bytes.byteLength}). Use \`openssl rand -base64 32\`.`,
		);
	}
	cachedKey = await crypto.subtle.importKey("raw", bytes, { name: "AES-GCM", length: 256 }, false, [
		"encrypt",
		"decrypt",
	]);
	cachedKeyMaterial = raw;
	return cachedKey;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
