import { getTheme, listThemeIds } from "@katto/design-system";
import { useLayoutEffect } from "react";
import { useThemeStore } from "~/stores/theme-store";

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: string;
}

export function ThemeProvider({ children, defaultTheme = "katto" }: ThemeProviderProps) {
	const theme = useThemeStore((state) => state.theme);
	const setTheme = useThemeStore((state) => state.setTheme);

	useLayoutEffect(() => {
		const validDefault = listThemeIds().includes(defaultTheme) ? defaultTheme : "katto";
		const initial = theme ?? validDefault;
		const validated = getTheme(initial);
		document.documentElement.setAttribute("data-theme", validated.id);
		if (theme !== validated.id) {
			setTheme(validated.id);
		}
	}, [defaultTheme, theme, setTheme]);

	return <>{children}</>;
}
