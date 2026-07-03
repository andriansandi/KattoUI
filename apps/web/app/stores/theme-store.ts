import { getTheme } from "@katto/design-system";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
	theme: string;
	setTheme: (theme: string) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set) => ({
			theme: "katto",
			setTheme: (theme) => {
				const valid = getTheme(theme);
				document.documentElement.setAttribute("data-theme", valid.id);
				set({ theme: valid.id });
			},
		}),
		{ name: "katto-theme" },
	),
);
