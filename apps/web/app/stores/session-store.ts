import { create } from "zustand";
import { persist } from "zustand/middleware";

const GUEST_ID_STORAGE_KEY = "katto-guest-id";

interface SessionState {
	guestId: string;
	getOrCreateGuestId: () => string;
	resetGuestId: () => void;
}

function generateGuestId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const useSessionStore = create<SessionState>()(
	persist(
		(set, get) => ({
			guestId: "",
			getOrCreateGuestId: () => {
				let id = get().guestId;
				if (!id) {
					id = generateGuestId();
					set({ guestId: id });
				}
				return id;
			},
			resetGuestId: () => {
				set({ guestId: generateGuestId() });
			},
		}),
		{ name: GUEST_ID_STORAGE_KEY },
	),
);
