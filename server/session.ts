import type { Context, Next } from "hono";
import { type AuthSession, auth } from "./auth";

export type AppEnv = {
	Variables: {
		authSession: AuthSession;
	};
};

type AppContext = Context<AppEnv>;

export async function requireSession(
	c: AppContext,
	next: Next,
): Promise<Response | undefined> {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	c.set("authSession", session);
	await next();
}

export function getSession(c: AppContext): AuthSession {
	return c.get("authSession");
}
