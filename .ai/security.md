# AI Security Guide

## Frontend

- Sanitize any user-provided HTML. Avoid `dangerouslySetInnerHTML` for chat content.
- Use a strict Content-Security-Policy.
- Store tokens only in memory where possible; never log secrets.
- Validate all forms with Zod before sending.

## API

- Verify Clerk session tokens on protected routes.
- Never return secrets in API responses.
- Store provider API keys in Worker secrets or encrypted storage, never in the browser.
- Validate and sanitize all request bodies with Zod.
- Implement rate limiting before exposing endpoints publicly.

## Plugins

- Treat third-party code as untrusted.
- Load plugins with strict permission checks.
- Never let plugins access secrets or raw DOM outside their sandbox.

## Cloudflare

- Use Wrangler secrets for all sensitive values.
- Configure WAF and rate-limiting rules in production.
- Follow Cloudflare's security best practices for Workers and Pages.
