export interface Env {
	ENVIRONMENT: string;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	DB: D1Database;
}

export interface Variables {
	userId: string;
}
