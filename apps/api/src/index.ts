import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requireAuth } from "./middleware/auth.js";
import { chatRoute } from "./routes/chat.js";
import { healthRoute } from "./routes/health.js";
import { modelsRoute } from "./routes/models.js";
import { providerConfigsRoute } from "./routes/provider-configs.js";
import { providersRoute } from "./routes/providers.js";
import type { Env } from "./types.js";

const app = new Hono<{ Bindings: Env }>();

app.use(logger());
app.use(
	"*",
	cors({
		origin: ["http://localhost:5177", "https://katto-ui.pages.dev"],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		credentials: true,
	}),
);

app.route("/health", healthRoute);

app.use("/providers", requireAuth);
app.route("/providers", providersRoute);

app.route("/provider-configs", providerConfigsRoute);

app.use("/models", requireAuth);
app.route("/models", modelsRoute);

app.use("/chat", requireAuth);
app.route("/chat", chatRoute);

app.get("/", (c) => {
	return c.json({
		name: "katto-api",
		version: "0.1.0",
		documentation: "https://github.com/kattoui/kattoui",
	});
});

export default app;
