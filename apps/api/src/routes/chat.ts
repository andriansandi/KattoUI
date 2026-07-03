import { Hono } from "hono";
import type { Env } from "../types.js";

const app = new Hono<{ Bindings: Env }>();

// Placeholder streaming chat endpoint.
app.post("/", async (c) => {
	const body = await c.req.json<{
		messages?: Array<{ role: string; content: string }>;
	}>();
	const lastMessage = body.messages?.at(-1)?.content ?? "Hello";

	const response = `KattoUI received: "${lastMessage}". Streaming and provider integration will be implemented in Phase 5.`;

	return c.json({
		id: crypto.randomUUID(),
		role: "assistant",
		content: response,
		model: "mock",
	});
});

export { app as chatRoute };
