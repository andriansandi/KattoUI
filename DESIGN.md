# KattoUI Design Language

This document is the single source of truth for KattoUI's visual language. It is not a UI specification. It is not a component library. It defines the philosophy behind every screen.

---

## Philosophy

KattoUI is a professional AI workspace. It is designed for developers. It should feel calm, fast, and effortless. The interface should disappear so users can focus on conversations. Everything should feel intentional.

---

## Design Principles

### Professional first

Professional software always comes before personality. The interface should be trusted before it becomes memorable.

### Chat first

The conversation is the product. Everything else exists to support the conversation. Navigation, providers, models, and settings should never compete with the chat.

### Less UI

Every new element must justify its existence. Prefer whitespace over containers. Prefer typography over decoration. Prefer simplicity over discoverability.

### Keyboard first

Everything important should be reachable without touching the mouse. The command palette is a primary navigation pattern. Keyboard shortcuts should be visible and consistent.

### Progressive disclosure

Do not expose future capabilities too early. Only show what users need today. Advanced features should appear naturally as the product grows.

---

## Brand Personality

KattoUI has personality. It does not have a mascot. Cats inspire the experience. They do not dominate it.

**Allowed:**
- Subtle paw prints
- Small loading animations
- Sleeping cat illustrations
- Tiny empty-state graphics
- Playful copy like "Meow!"

**Not allowed:**
- Cartoon interface
- Anime cats
- Giant mascots
- Emoji everywhere
- Decorative clutter

Cats are personality, not decoration.

---

## Visual Language

The interface should feel like a mix of:
- Linear
- Claude
- Raycast
- Vercel
- GitHub

Avoid looking like:
- Open WebUI
- Discord
- Slack
- Generic admin dashboards

---

## Colors

Warm neutral palette. Orange is an accent. Orange is not the interface.

Use orange only for:
- Primary actions
- Active states
- Focus
- Highlights

Everything else should remain neutral.

---

## Typography

Typography carries hierarchy, not borders.

Use:
- Display
- Heading XL
- Heading L
- Heading M
- Body
- Small
- Caption

Avoid multiple font weights. Whitespace creates emphasis.

---

## Spacing

Use an 8-point spacing system. Layouts should breathe. Avoid dense dashboards. Prefer larger spacing over more borders.

---

## Radius

Keep radius consistent.

| Surface | Radius |
|---------|--------|
| Cards | 20px |
| Dialogs | 24px |
| Buttons | Full |
| Inputs | Full |
| Badges | Full |

Never mix many radius values.

---

## Shadows

Use soft shadows with minimal contrast. Three levels only: small, medium, large. Avoid hard shadows.

---

## Borders

Borders are subtle. Use one consistent border color. Avoid stacking border inside border.

---

## Motion

Motion should feel calm.

Recommended duration: 220ms. Use ease-out curves. Animations should communicate state. Never animate just for decoration.

---

## Icons

Lucide only. Consistent stroke width. Icons support text. They never replace text.

---

## Density

Every screen should answer: can something be removed? Before asking: can something be added? Whitespace is a feature.

---

## Components

Every component should answer:
- Is it useful?
- Is it reusable?
- Does it reduce cognitive load?

If not, do not build it.

---

## Empty States

Empty states should feel welcoming.

Examples:
- Meow!
- Ready to build something?
- Choose a model and start chatting.

Keep copy short. Never use paragraphs.

---

## Chat Experience

The chat is always the visual focus. Conversation occupies the largest area. Input remains anchored. History stays secondary. Settings stay hidden until needed.

---

## Navigation

Navigation should stay minimal. The initial sidebar should contain only:
- Chat
- Providers
- Models
- Themes
- Settings

Everything else appears when those features actually exist.

---

## Theme Philosophy

Themes never change layout. Themes only change:
- Colors
- Typography
- Radius
- Spacing
- Shadows
- Motion
- Decoration

Layout must always remain familiar. See [THEMING.md](./THEMING.md) for the token implementation.

---

## Accessibility

- Minimum WCAG AA
- Keyboard accessible
- Visible focus states
- Good contrast
- Readable typography
- Large click targets

---

## Design Goal

A user opening KattoUI should think:
- "This feels fast."
- "This feels professional."
- "This feels carefully designed."

Not: "There are a lot of features."

---

## One Sentence

> KattoUI should feel like Linear built an AI workspace with a subtle cat personality.
