import { verifyToken } from "@clerk/backend";
import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../types.js";

export const requireAuth = createMiddleware<{
	Bindings: Env;
	Variables: Variables;
}>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	const token = authHeader?.replace("Bearer ", "").trim();

	if (!token) {
		return c.json({ error: "Missing authorization header" }, 401);
	}

	try {
		const payload = await verifyToken(token, {
			secretKey: c.env.CLERK_SECRET_KEY,
		});
		c.set("userId", payload.sub as string);
		return next();
	} catch (error) {
		return c.json({ error: "Unauthorized", details: String(error) }, 401);
	}
});
