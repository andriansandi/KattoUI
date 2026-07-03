const STORAGE_KEY = "katto.guestSession";

/** Returns the current guest session id, creating one on first visit. */
export function getGuestSessionId(): string {
	if (typeof window === "undefined") return "";
	let id = window.localStorage.getItem(STORAGE_KEY);
	if (!id) {
		id = crypto.randomUUID();
		window.localStorage.setItem(STORAGE_KEY, id);
	}
	return id;
}

/** Clears the guest session (e.g. after migrating to a Clerk account). */
export function clearGuestSession(): void {
	if (typeof window !== "undefined") {
		window.localStorage.removeItem(STORAGE_KEY);
	}
}
