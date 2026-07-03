# KattoUI Theming

KattoUI uses a token-driven theme engine. Themes define visual properties only — colors, typography, spacing, radius, shadows, and motion. Themes never change layouts.

---

## How themes work

A theme is a `ThemeDefinition` object defined in `packages/sdk/src/theme.ts`:

```ts
export interface ThemeDefinition {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  tokens: ThemeTokens;
}
```

`ThemeTokens` contains:

- `colors` — semantic color roles (`background`, `foreground`, `primary`, etc.)
- `typography` — font families, sizes, weights, line heights, letter spacing
- `spacing` — named spacing steps
- `radius` — named border-radius steps
- `shadows` — named box shadows
- `animations` — named easings and durations

The `ThemeProvider` in `apps/web` reads the active theme and writes CSS custom properties to the document root. Components consume those variables, so switching themes updates the entire UI instantly.

---

## CSS variable generation

For each color role, the design system emits a CSS custom property:

```css
:root {
  --color-background: #FDFBF7;
  --color-foreground: #18181B;
  --color-primary: #D97706;
  --color-primary-foreground: #FFFFFF;
  /* ... */
}
```

Tailwind uses those variables through utility classes such as:

```html
<div class="bg-[var(--color-background)] text-[var(--color-foreground)]">
```

The generated file lives in `packages/design-system/src/styles/themes.css`.

---

## Adding a new theme

1. Create a new file under `packages/design-system/src/themes/{my-theme}.ts`.
2. Export a `ThemeDefinition` object.
3. Import and register it in the design-system theme index.
4. Optionally expose it in `apps/web/routes/_authenticated/settings/themes.tsx` so users can choose it.

### Example theme

```ts
import type { ThemeDefinition } from "@katto/sdk";

export const oceanTheme: ThemeDefinition = {
  id: "ocean",
  name: "Ocean",
  description: "Cool blue-grey theme for focused work.",
  tokens: {
    colors: {
      background: "#F8FAFC",
      foreground: "#0F172A",
      card: "#FFFFFF",
      cardForeground: "#0F172A",
      popover: "#FFFFFF",
      popoverForeground: "#0F172A",
      primary: "#0EA5E9",
      primaryForeground: "#FFFFFF",
      secondary: "#E2E8F0",
      secondaryForeground: "#0F172A",
      muted: "#F1F5F9",
      mutedForeground: "#64748B",
      accent: "#E0F2FE",
      accentForeground: "#0369A1",
      destructive: "#EF4444",
      destructiveForeground: "#FFFFFF",
      border: "#CBD5E1",
      input: "#CBD5E1",
      ring: "#0EA5E9",
    },
    typography: {
      fontFamily: {
        sans: "Inter, ui-sans-serif, system-ui, sans-serif",
        mono: "JetBrains Mono, ui-monospace, monospace",
      },
      fontSize: {
        xs: ["0.75rem", "1rem"],
        base: ["1rem", "1.5rem"],
        // ...
      },
      fontWeight: { normal: "400", medium: "500", semibold: "600", bold: "700" },
      lineHeight: { tight: "1.25", normal: "1.5", relaxed: "1.625" },
      letterSpacing: { tight: "-0.025em", normal: "0", wide: "0.025em" },
    },
    spacing: { "1": "0.25rem", "2": "0.5rem", "4": "1rem" /* ... */ },
    radius: { sm: "0.375rem", md: "0.5rem", lg: "0.75rem", full: "9999px" },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    },
    animations: {
      "duration-fast": "150ms",
      "duration-normal": "250ms",
      "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
    },
  },
};
```

---

## Theme SDK contract

The contract between the design system and the rest of the app is small:

| Export | Location | Purpose |
|--------|----------|---------|
| `ThemeDefinition` | `packages/sdk/src/theme.ts` | Shape of a theme. |
| `ThemeProvider` | `apps/web/app/components/theme-provider.tsx` | Applies active theme and listens to theme store. |
| `useThemeStore` | `apps/web/app/stores/theme-store.ts` | Active theme id and setter. |
| `kattoTheme` | `packages/design-system/src/themes/katto.ts` | Default built-in theme. |

Components should consume CSS variables, not hard-code theme values.

---

## Built-in themes

| Theme | File | Description |
|-------|------|-------------|
| `katto` | `packages/design-system/src/themes/katto.ts` | Default warm theme with subtle amber accents. Professional and minimal. |
| `midnight` | `packages/design-system/src/themes/midnight.ts` | Dark, high-contrast theme for low-light work. |
| `cloudflare` | `packages/design-system/src/themes/cloudflare.ts` | Cloudflare brand-inspired orange and slate palette. |

Additional themes can be installed via plugins in future releases.

---

## Best practices

- Keep colors semantic (`primary`, `muted`) rather than literal (`blue-500`).
- Ensure foreground colors pass WCAG contrast against their backgrounds.
- Limit accent usage to focus states, selections, and call-to-action elements.
- Do not put layout values (sidebar width, page max-width) inside `ThemeTokens`.
- Test themes in both light and dark variants where applicable.
