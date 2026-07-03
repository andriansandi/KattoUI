# AI Design Guide

## Visual Direction

- Professional, minimal, enterprise-ready.
- Inspirations: Linear, Vercel, Raycast, GitHub, ChatGPT, Claude.
- Cat inspiration lives only in branding (logo, name, primary accent). UI itself must not be cartoonish.

## Theme System

- All visual styling uses the design tokens in `packages/design-system`.
- Use Tailwind semantic utilities: `bg-background`, `text-foreground`, `border-border`, `text-primary`.
- Do not hardcode hex/rgb colors in components.
- Themes only change colors, typography, radius, spacing, shadows, and motion. They never change layouts.

## Motion

- Use `motion` for animations.
- Keep animations subtle and fast (150-350ms).
- Respect `prefers-reduced-motion`.

## Copy

- Use real, concise copy. No lorem ipsum.
- Labels should be sentence case.
- Error messages should explain what went wrong and what to do next.

## Accessibility

- Maintain keyboard navigability.
- Ensure sufficient color contrast.
- Provide meaningful alt text and ARIA labels.
