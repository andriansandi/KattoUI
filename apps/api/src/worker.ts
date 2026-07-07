import app from "./index";
import type { Env } from "./types";

// @ts-expect-error - build artifact from `vite build` in apps/web
import server from "../../web/dist/server/server.js";

const API_PREFIXES = ["/health", "/providers", "/provider-configs", "/conversations"];

export default {
	async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname } = new URL(req.url);

		if (API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
			return app.fetch(req, env, ctx);
		}

		return (server as { fetch(...args: unknown[]): Promise<Response> }).fetch(req, env, ctx);
	},
};
