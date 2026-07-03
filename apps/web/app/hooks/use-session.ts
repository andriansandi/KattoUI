import { useSessionStore } from "~/stores/session-store";

export interface Session {
	mode: "guest" | "clerk";
	isLoaded: boolean;
	isSignedIn: boolean;
	userId: string | null;
	displayName: string;
	avatarUrl?: string;
}

/**
 * Returns the current guest session for use during local testing.
 *
 * This hook intentionally does not import Clerk hooks directly, because Clerk
 * React hooks are not SSR-safe in the current TanStack Start setup. Components
 * that need Clerk-aware UI (e.g. the user button) should render inside a
 * client-only wrapper and use Clerk components/hooks there.
 */
export function useSession(): Session {
	const guestId = useSessionStore((state) => state.guestId);

	return {
		mode: "guest",
		isLoaded: true,
		isSignedIn: false,
		userId: guestId || null,
		displayName: "Guest",
	};
}
