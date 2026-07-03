import { Hono } from "hono";
import type { Env } from "../types.js";

const app = new Hono<{ Bindings: Env }>();

const models = [
	{
		id: "gpt-4o",
		name: "GPT-4o",
		providerId: "openai",
		contextWindow: 128000,
		capabilities: ["chat", "vision", "tools", "json"],
	},
	{
		id: "claude-3-5-sonnet",
		name: "Claude 3.5 Sonnet",
		providerId: "anthropic",
		contextWindow: 200000,
		capabilities: ["chat", "vision", "tools"],
	},
	{
		id: "llama-3-1-8b-instruct",
		name: "Llama 3.1 8B Instruct",
		providerId: "cloudflare",
		contextWindow: 8192,
		capabilities: ["chat"],
	},
];

app.get("/", (c) => {
	return c.json({ models });
});

export { app as modelsRoute };
