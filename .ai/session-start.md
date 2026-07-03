# AI Session Start

Every AI coding session for KattoUI must begin by ensuring the local development environment is running.

## Required Steps

1. Open a terminal in the repository root (`/home/andriansandi/Projects/kattoUI`).
2. If `.env` files do not exist, copy them from `.env.example` and populate Clerk credentials.
3. Run:

   ```bash
   pnpm install
   pnpm dev
   ```

4. Wait for both processes to start:
   - Frontend: `http://localhost:5177`
   - API Worker: `http://localhost:8791`

## Verification

Run the following command and confirm a JSON response:

```bash
curl http://localhost:8791/health
```

Expected output:

```json
{
  "status": "ok",
  "service": "katto-api",
  "version": "0.1.0"
}
```

Open `http://localhost:5177` in a browser and confirm the landing page loads.

## If Servers Fail

Start them separately to see clear error output:

```bash
pnpm dev:web   # TanStack Start on localhost:5177
pnpm dev:api   # Wrangler Worker on localhost:8791
```

Do not make code changes until both servers are healthy, unless the change is specifically to fix a startup failure.
