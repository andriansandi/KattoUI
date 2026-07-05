export interface Env {
	ENVIRONMENT: string;
	GUEST_MODE: string;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	/** Base64-encoded 32-byte key used to encrypt provider API tokens at rest. */
	ENCRYPTION_KEY: string;
	DB: D1Database;
}

export interface Variables {
	userId: string;
}
