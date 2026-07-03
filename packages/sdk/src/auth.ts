/** User context exposed by the auth abstraction. */
export interface AuthUser {
	id: string;
	email?: string;
	name?: string;
	avatarUrl?: string;
	organizations?: AuthOrganization[];
}

/** Organization/workspace context. */
export interface AuthOrganization {
	id: string;
	name: string;
	role?: string;
}

/** Auth session state. */
export interface AuthSession {
	isAuthenticated: boolean;
	isLoading: boolean;
	user?: AuthUser;
	token?: string;
}

/** Auth adapter abstraction. Implementations can swap Clerk, WorkOS, Lucia, etc. */
export interface AuthAdapter {
	name: string;
	getSession(): Promise<AuthSession> | AuthSession;
	signIn(redirectTo?: string): Promise<void> | void;
	signOut(): Promise<void> | void;
	getToken(): Promise<string | undefined> | string | undefined;
}
