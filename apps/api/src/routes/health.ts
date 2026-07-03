import { Hono } from "hono";
import type { Env } from "../types.js";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
	return c.json({
		status: "ok",
		service: "katto-api",
		version: "0.1.0",
		environment: c.env.ENVIRONMENT,
		timestamp: new Date().toISOString(),
	});
});

export { app as healthRoute };
