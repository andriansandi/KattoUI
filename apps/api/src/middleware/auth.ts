import { verifyToken } from "@clerk/backend";
import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../types.js";

const GUEST_PREFIX = "guest_";

export const requireAuth = createMiddleware<{
	Bindings: Env;
	Variables: Variables;
}>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	const token = authHeader?.replace("Bearer ", "").trim();

	// 1. Clerk JWT bearer token — preferred when a user is signed in.
	if (token && !token.startsWith(GUEST_PREFIX)) {
		try {
			const payload = await verifyToken(token, {
				secretKey: c.env.CLERK_SECRET_KEY,
			});
			c.set("userId", payload.sub as string);
			return next();
		} catch (error) {
			return c.json({ error: "Unauthorized", details: String(error) }, 401);
		}
	}

	// 2. Guest session — enabled by `GUEST_MODE`. The client sends a stable
	//    session id via the `X-Guest-Session` header; we scope data per session.
	//    Expiry enforcement and guest→Clerk migration land in a later slice.
	if (c.env.GUEST_MODE === "true") {
		const guestSession = c.req.header("X-Guest-Session")?.trim();
		if (guestSession) {
			c.set("userId", `${GUEST_PREFIX}${guestSession}`);
			return next();
		}
	}

	return c.json({ error: "Missing authorization header" }, 401);
});
