# RFC 0002: KattoUI Theme Engine

| Field | Value |
|-------|-------|
| Status | Draft |
| Authors | KattoUI Core Team |
| Created | 2026-07-02 |
| Updated | 2026-07-02 |
| Related | ADR 0004, RFC 0001 |

## Summary

This RFC specifies the KattoUI theme engine. Themes are data-driven, CSS-variable based declarations of visual style. They describe colors, typography, radius, spacing, icons, animations, and decorations only. Themes never change layouts. The engine supports runtime switching, installable theme packages, and automatic synchronization of Clerk authentication UI appearance with the active theme.

## Motivation

A professional AI chat interface must look coherent across the application, authentication flows, and plugin-contributed UI. Without a token contract, every shadcn primitive, plugin panel, and Clerk form drifts to a different visual language. A single, CSS-variable based theme engine ensures:

1. One source of truth for visual values.
2. Instant runtime theme switching without re-rendering heavy component trees.
3. A clear path for users and third-party developers to install or author themes.
4. Authentication UI that matches the rest of the application.

## Terminology

| Term | Definition |
|------|------------|
| **Token** | A named design value (e.g., `color.background`, `font.family.sans`, `radius.md`). |
| **Token Contract** | The complete, versioned set of tokens a theme must provide. |
| **Theme** | A JSON object mapping tokens to values, plus an optional CSS layer for animations or decorations. |
| **CSS Variable Layer** | A generated stylesheet that writes token values to CSS custom properties on `:root` or a scoped container. |
| **Clerk Appearance** | A subset of the theme token contract translated into Clerk's `Appearance` object so sign-in/sign-up forms match the active theme. |
| **Theme Registry** | A runtime or build-time collection of available themes keyed by unique theme IDs. |

## Proposal

### 1. Token Contract

The token contract is a TypeScript schema exported from `packages/sdk`. Every token has a stable dotted path. Values may be raw CSS values or references to other tokens.

#### 1.1 Color Tokens

Colors are expressed in any CSS-compatible format. The default theme uses OKLCH for perceptual uniformity.

```
color.background
  color.background.DEFAULT
  color.background.hover
  color.background.active
  color.background.subtle
  color.background.muted
color.foreground
  color.foreground.DEFAULT
  color.foreground.muted
  color.foreground.inverse
color.primary
  color.primary.DEFAULT
  color.primary.foreground
  color.primary.hover
  color.primary.active
color.secondary
color.accent
color.success
color.warning
color.danger
  ... and semantic variants
color.border
color.ring
color.overlay
  ...
```

#### 1.2 Typography Tokens

```
font.family.sans
font.family.mono
font.family.display
font.size.xs
font.size.sm
font.size.base
font.size.lg
font.size.xl
font.size.2xl
...
font.weight.normal
font.weight.medium
font.weight.semibold
font.weight.bold
lineHeight.tight
lineHeight.normal
lineHeight.relaxed
letterSpacing.tight
letterSpacing.normal
letterSpacing.wide
```

#### 1.3 Dimension Tokens

```
radius.none
radius.sm
radius.md
radius.lg
radius.xl
radius.full
spacing.unit
spacing.xs
...
shadow.sm
shadow.md
shadow.lg
```

#### 1.4 Motion Tokens

```
motion.duration.fast
motion.duration.normal
motion.duration.slow
motion.easing.DEFAULT
motion.easing.in
motion.easing.out
```

#### 1.5 Icon Tokens

```
icon.set              # "lucide" | custom icon set identifier
icon.weight           # 1 | 1.5 | 2 | ...
```

### 2. Theme Schema

A valid theme is a JSON object conforming to the token contract plus metadata.

```ts
interface Theme {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version: string;
  license?: string;
  base: "light" | "dark";
  tokens: TokenContract;
  // Optional CSS appended after the generated variable layer.
  css?: string;
  // Optional clerk appearance overrides derived from tokens.
  clerkAppearance?: Partial<ClerkAppearance>;
}
```

### 3. CSS Variable Generation

`packages/design-system` exposes `generateThemeCss(theme)` which produces a stylesheet:

```css
[data-theme="katto"] {
  --color-background: oklch(0.985 0.001 286.375);
  --color-foreground: oklch(0.141 0.005 285.823);
  --font-family-sans: "Inter", system-ui, sans-serif;
  --radius-md: 0.5rem;
  ...
}
```

Tailwind v4 references these variables directly in its `@theme` block:

```css
@import "tailwindcss";

@theme {
  --color-background: var(--color-background);
  --color-foreground: var(--color-foreground);
  ...
}
```

The `data-theme` attribute on `<html>` controls activation. Changing it immediately switches the visual layer.

### 4. Runtime Switching

Theme state is stored in Zustand and persisted to `localStorage`. On hydration:

1. Read persisted theme ID or fallback to system preference.
2. Resolve the theme from the `ThemeRegistry`.
3. Inject the generated CSS if not already present.
4. Set `document.documentElement.dataset.theme = theme.id`.
5. Notify Clerk appearance provider to update.

A `ThemeProvider` wraps the application and re-runs steps 3–5 whenever the active theme changes.

### 5. Installable Themes

Themes can be bundled in three ways:

1. **Built-in** — shipped inside `packages/design-system` or `apps/web`.
2. **Plugin-supplied** — a plugin manifest declares a `themes` array. The theme is registered at plugin load time.
3. **Runtime-loaded** — a future settings panel accepts a URL or pasted JSON theme, validates it against the token contract, and activates it.

All installed themes are validated with Zod before registration. Invalid themes are rejected with a clear error message.

### 6. Clerk Appearance Sync

The theme engine derives a Clerk `Appearance` object from the active theme. The mapping is explicit and centralized in `packages/design-system`:

```ts
function themeToClerkAppearance(theme: Theme): Appearance {
  return {
    variables: {
      colorPrimary: theme.tokens.color.primary.DEFAULT,
      colorBackground: theme.tokens.color.background.DEFAULT,
      colorText: theme.tokens.color.foreground.DEFAULT,
      colorDanger: theme.tokens.color.danger.DEFAULT,
      borderRadius: theme.tokens.radius.md,
      fontFamily: theme.tokens.font.family.sans,
      fontSize: theme.tokens.font.size.base,
    },
    elements: {
      card: { boxShadow: theme.tokens.shadow.md },
      formButtonPrimary: { fontWeight: theme.tokens.font.weight.medium },
    },
  };
}
```

The Clerk provider receives `appearance={themeToClerkAppearance(activeTheme)}`. When the theme changes, Clerk re-renders its components with the new values.

### 7. Default Theme: `katto`

The default `katto` theme is a warm, minimal light theme with a dark counterpart.

Design principles:

- Generous whitespace.
- Subtle grays as the dominant palette.
- A single accent color used sparingly.
- No gradients as backgrounds.
- 2px focus rings using `--color-ring`.
- Smooth, short transitions for interactive elements.

### 8. Security Considerations

- Runtime-loaded theme CSS must be sanitized to prevent `url()` exfiltration or expression injection. Sanitization is performed before any CSS is injected into the DOM.
- Theme JSON is validated against the token contract with Zod.
- Custom themes cannot override layout, `position: fixed`, or `display` properties through the token contract.

## Drawbacks

1. Token contract versioning is required; adding tokens may break older themes.
2. Generating and injecting CSS at runtime adds a small amount of JavaScript.
3. Mapping every Clerk UI element to theme tokens requires ongoing maintenance when Clerk updates its appearance API.

## Alternatives

| Alternative | Why not chosen |
|-------------|----------------|
| CSS-in-JS (Tailwind arbitrary values, styled-components) | CSS variables are framework agnostic, zero-runtime, and easier for plugins/themes to override. |
| Tailwind `theme.extend` per theme | Tailwind builds all themes at compile time, preventing runtime installation and switching. |
| One compiled CSS file per theme | Simple but prevents dynamic merging of plugin themes and increases bundle size. |

## Adoption

1. Define the `TokenContract` schema in `packages/sdk`.
2. Implement `generateThemeCss` and `themeToClerkAppearance` in `packages/design-system`.
3. Author the default `katto` theme.
4. Add `ThemeProvider`, `useTheme`, and theme persistence to `apps/web`.
5. Add settings UI for theme selection.
