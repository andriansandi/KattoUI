import { Hono } from "hono";
import type { Env } from "../types.js";

const app = new Hono<{ Bindings: Env }>();

const providers = [
	{
		id: "openai",
		name: "OpenAI",
		description: "Access GPT-4o, GPT-4, and GPT-3.5 models.",
		capabilities: { chat: true, embeddings: true, images: true, speech: true },
	},
	{
		id: "anthropic",
		name: "Anthropic",
		description: "Access Claude 3.5 and Claude 3 models.",
		capabilities: { chat: true },
	},
	{
		id: "cloudflare",
		name: "Cloudflare AI",
		description: "Run models on Cloudflare Workers AI infrastructure.",
		capabilities: { chat: true, embeddings: true, images: true },
	},
];

app.get("/", (c) => {
	return c.json({ providers });
});

export { app as providersRoute };
