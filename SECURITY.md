# Security Policy

KattoUI handles authentication tokens, AI provider credentials, and potentially sensitive chat data. Security is treated as a first-class concern throughout the stack.

---

## Security checklist

### Web application

- [ ] **Content Security Policy (CSP).** A strict `Content-Security-Policy` header is set to prevent XSS and data exfiltration. Inline scripts and styles are avoided; nonces or hashes are used where necessary.
- [ ] **Trusted types.** Where supported, trusted-types are enforced to reduce DOM XSS risk.
- [ ] **Output encoding.** User and model content is rendered through a sanitized HTML pipeline. Raw HTML injection is disabled unless explicitly safe.
- [ ] **Cookie security.** Session cookies use `Secure`, `HttpOnly`, and `SameSite` attributes.
- [ ] **Sensitive fields.** API keys and secrets are never returned to the browser in plain text.

### API and Worker

- [ ] **Authentication.** All non-public routes require a valid Clerk session token validated by `@clerk/backend`.
- [ ] **Authorization.** Resources are scoped to workspaces; users cannot access another workspace's conversations or API keys without membership.
- [ ] **CORS.** CORS is configured narrowly for allowed origins (`http://localhost:5177`, `https://katto-ui.pages.dev`, and your production domain).
- [ ] **Secrets storage.** Clerk and provider API keys are stored in Cloudflare Workers Secrets, never in code or `vars`.
- [ ] **Rate limiting.** Per-user and per-workspace rate limits are enforced on streaming, model listing, and authentication endpoints.
- [ ] **Input validation.** All API requests are validated with Zod before processing.
- [ ] **No eval.** Server code does not use `eval`, `new Function`, or dynamic code execution for plugin code.

### Provider and AI safety

- [ ] **Prompt injection awareness.** User input is treated as untrusted. System prompts are clearly separated, and model responses are rendered safely.
- [ ] **Tool call confirmation.** Destructive or external-facing tool calls require explicit user approval before execution.
- [ ] **Provider key rotation.** Provider keys can be rotated from the workspace settings without restarting the API.
- [ ] **Audit logging.** API key usage, provider calls, and admin actions are logged through the structured `Logger` abstraction.

### Plugin sandboxing

- [ ] **Manifest validation.** Plugin manifests are validated against a strict Zod schema.
- [ ] **Permission model.** Plugins declare permissions; the host enforces them.
- [ ] **Storage namespacing.** Plugin storage is isolated by plugin id.
- [ ] **Network allow-listing.** Plugin network requests are restricted to allowed origins or require explicit consent.
- [ ] **Code isolation.** Remote plugin code is loaded in a sandboxed iframe or Web Worker when feasible.
- [ ] **Audit trail.** Plugin activation, permission grants, and errors are logged.

### Cloudflare best practices

- [ ] **WAF.** Cloudflare Web Application Firewall rules protect public endpoints.
- [ ] **Turnstile.** Public forms use Cloudflare Turnstile to mitigate abuse.
- [ ] **Access.** Preview deployments are restricted with Cloudflare Access if they expose unreleased features.
- [ ] **Secrets.** `wrangler secret put` is used for all sensitive values.
- [ ] **Least privilege.** Worker bindings are scoped to the minimum resources the app needs.

---

## Supported versions

Only the latest minor version is actively supported with security updates. Self-hosters should track releases and upgrade promptly.

| Version | Status |
|---------|--------|
| 0.1.x   | Active development |

---

## Reporting a vulnerability

If you discover a security issue in KattoUI, please report it responsibly.

1. **Do not open a public issue.**
2. Email the maintainers at **security@katto.dev** (replace with your actual security contact once available).
3. Include a clear description, reproduction steps, and impact assessment.
4. Allow us reasonable time to investigate and fix the issue before any public disclosure.
5. We will acknowledge receipt within 48 hours and share progress as we work toward a resolution.

Contributors and security researchers who report valid vulnerabilities will be credited in the changelog unless they prefer to remain anonymous.

---

## Security-related configuration

### Enabling CSP in development

The API worker and web server should both emit headers. Example Hono middleware:

```ts
app.use("*", async (c, next) => {
  c.header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
  await next();
});
```

### Setting a secret

```bash
cd apps/api
wrangler secret put PROVIDER_OPENAI_API_KEY
```

### Rate-limiting template

Rate limiting will be implemented as middleware using Cloudflare Workers KV or Durable Objects to track request counts per key.
