import { create } from "zustand";

interface UIState {
	commandPaletteOpen: boolean;
	setCommandPaletteOpen: (open: boolean) => void;
	toggleCommandPalette: () => void;
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
	toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
	commandPaletteOpen: false,
	setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
	toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
	sidebarOpen: true,
	setSidebarOpen: (open) => set({ sidebarOpen: open }),
	toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
