// One-time migration: encrypt plaintext `api_token` values in `provider_configs`.
//
// Usage:
//   pnpm migrate:encrypt-keys              # local D1 (default)
//   pnpm migrate:encrypt-keys -- --remote  # remote D1
//
// Reads `ENCRYPTION_KEY` from `.dev.vars` (local) or the `ENCRYPTION_KEY` env
// var (remote). Idempotent — rows already in the `v1:` encrypted format or
// tokenless (`""`) are skipped. The encryption format mirrors
// `apps/api/src/lib/crypto.ts` exactly.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DB_NAME = "katto-ui-db";
const PREFIX = "v1:";
const IV_LENGTH = 12;
const isRemote = process.argv.includes("--remote");

function readEncryptionKey() {
	if (isRemote) {
		const k = process.env.ENCRYPTION_KEY;
		if (!k) {
			throw new Error("ENCRYPTION_KEY env var is required for --remote migration.");
		}
		return k;
	}
	const raw = readFileSync(".dev.vars", "utf8");
	const match = raw.match(/^ENCRYPTION_KEY=(.+)$/m);
	if (!match) {
		throw new Error("ENCRYPTION_KEY not found in .dev.vars. Generate one with `openssl rand -base64 32`.");
	}
	return match[1].trim();
}

async function getKey(rawKey) {
	const bytes = Buffer.from(rawKey, "base64");
	if (bytes.byteLength !== 32) {
		throw new Error(
			`ENCRYPTION_KEY must decode to 32 bytes (got ${bytes.byteLength}). Use \`openssl rand -base64 32\`.`,
		);
	}
	return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM", length: 256 }, false, [
		"encrypt",
	]);
}

async function encrypt(plaintext, key) {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encoded = new TextEncoder().encode(plaintext);
	const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
	return `${PREFIX}${Buffer.from(iv).toString("base64")}:${Buffer.from(new Uint8Array(ciphertext)).toString("base64")}`;
}

function d1(command) {
	const flag = isRemote ? "--remote" : "--local";
	return JSON.parse(
		execSync(
			`npx wrangler d1 execute ${DB_NAME} ${flag} --json --command "${command.replace(/"/g, '\\"')}"`,
			{ encoding: "utf8" },
		),
	);
}

async function main() {
	const rawKey = readEncryptionKey();
	const key = await getKey(rawKey);

	const out = d1("SELECT id, api_token FROM provider_configs");
	const rows = out[0]?.results ?? [];
	console.log(`Found ${rows.length} provider config row(s).`);

	let encrypted = 0;
	let skipped = 0;
	for (const row of rows) {
		const token = row.api_token;
		if (token === "" || token.startsWith(PREFIX)) {
			skipped++;
			continue;
		}
		const enc = await encrypt(token, key);
		// Base64 + `:` are SQL-safe (no single quotes), so interpolation is safe here.
		d1(`UPDATE provider_configs SET api_token = '${enc}' WHERE id = '${row.id}'`);
		encrypted++;
		console.log(`  encrypted ${row.id}`);
	}

	console.log(`Done. Encrypted ${encrypted}, skipped ${skipped}.`);
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
