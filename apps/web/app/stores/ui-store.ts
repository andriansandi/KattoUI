import { create } from "zustand";

interface PendingMessage {
	conversationId: string;
	content: string;
}

interface UIState {
	commandPaletteOpen: boolean;
	setCommandPaletteOpen: (open: boolean) => void;
	toggleCommandPalette: () => void;
	mobileSidebarOpen: boolean;
	setMobileSidebarOpen: (open: boolean) => void;
	toggleMobileSidebar: () => void;
	pendingMessage: PendingMessage | null;
	setPendingMessage: (msg: PendingMessage | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
	commandPaletteOpen: false,
	setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
	toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
	mobileSidebarOpen: false,
	setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
	toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
	pendingMessage: null,
	setPendingMessage: (msg) => set({ pendingMessage: msg }),
}));
