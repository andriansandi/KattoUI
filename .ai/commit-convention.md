# AI Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `style` — formatting, no logic change
- `refactor` — code change that neither fixes nor adds a feature
- `test` — adding or updating tests
- `chore` — tooling, dependencies, CI

## Scopes

Examples: `web`, `api`, `sdk`, `design-system`, `theme`, `provider`, `plugin`, `auth`, `docs`.

## Examples

```
feat(web): add command palette
fix(api): validate provider token before request
docs(adr): record Tailwind v4 decision
```

A single commit should represent a single logical change. Do not bundle unrelated changes.
