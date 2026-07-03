/** Color scale keyed by semantic role. */
export interface ThemeColors {
	background: string;
	foreground: string;
	card: string;
	cardForeground: string;
	popover: string;
	popoverForeground: string;
	primary: string;
	primaryForeground: string;
	secondary: string;
	secondaryForeground: string;
	muted: string;
	mutedForeground: string;
	accent: string;
	accentForeground: string;
	destructive: string;
	destructiveForeground: string;
	border: string;
	input: string;
	ring: string;
	"chart-1"?: string;
	"chart-2"?: string;
	"chart-3"?: string;
	"chart-4"?: string;
	"chart-5"?: string;
}

/** Typography scale. */
export interface ThemeTypography {
	fontFamily: {
		sans: string;
		mono: string;
	};
	fontSize: Record<string, [string, string]>;
	fontWeight: Record<string, string>;
	lineHeight: Record<string, string>;
	letterSpacing: Record<string, string>;
}

/** Spacing, radius, shadow, and motion tokens. */
export interface ThemeTokens {
	colors: ThemeColors;
	typography: ThemeTypography;
	spacing: Record<string, string>;
	radius: Record<string, string>;
	shadows: Record<string, string>;
	animations: Record<string, string>;
}

export interface ThemeDefinition {
	id: string;
	name: string;
	description?: string;
	preview?: string;
	tokens: ThemeTokens;
}
