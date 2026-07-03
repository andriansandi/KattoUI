import type { ThemeDefinition } from "@katto/sdk";
import { kattoTheme } from "./themes/katto.js";
import { midnightTheme } from "./themes/midnight.js";

export * from "./themes/katto.js";
export * from "./themes/midnight.js";

export const themes: ThemeDefinition[] = [kattoTheme, midnightTheme];

export const themesById = new Map<string, ThemeDefinition>(
	themes.map((theme) => [theme.id, theme]),
);

export function getTheme(id: string): ThemeDefinition {
	return themesById.get(id) ?? kattoTheme;
}

export function listThemeIds(): string[] {
	return themes.map((theme) => theme.id);
}
