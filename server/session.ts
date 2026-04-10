import type { Context, MiddlewareHandler } from "hono";
import type { AppAuth, AuthSession } from "./auth-core";

export type AppEnv = {
	Variables: {
		authSession: AuthSession;
	};
};

type AppContext = Context<AppEnv>;

export function createRequireSession(auth: AppAuth): MiddlewareHandler<AppEnv> {
	return async (c, next) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json({ message: "Unauthorized" }, 401);
		}

		c.set("authSession", session);
		await next();
	};
}

export function getSession(c: AppContext): AuthSession {
	return c.get("authSession");
}
