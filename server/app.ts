import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClaimsRouter } from "./routes/claims";
import { createListingsRouter } from "./routes/listings";
import { createUsersRouter } from "./routes/users";
import type { AppRuntime } from "./runtime";
import { type AppEnv, createRequireSession } from "./session";

export function createApp(runtime: AppRuntime) {
	const app = new Hono<AppEnv>({
		strict: false,
	});
	const requireSession = createRequireSession(runtime.auth);
	const usersRouter = createUsersRouter(runtime.db, requireSession);
	const listingsRouter = createListingsRouter(runtime.db, requireSession);
	const claimsRouter = createClaimsRouter(runtime.db, requireSession);

	app.use("*", logger());
	app.use(
		"*",
		cors({
			origin: (origin) => {
				if (!origin) {
					return runtime.config.allowedOrigins[0];
				}

				if (
					runtime.config.allowedOrigins.some((allowedOrigin) =>
						origin.startsWith(allowedOrigin),
					)
				) {
					return origin;
				}

				return runtime.config.allowedOrigins[0];
			},
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
			exposeHeaders: ["set-auth-token"],
			credentials: true,
		}),
	);

	app.get("/health", (c) => {
		return c.json({
			status: "ok",
			timestamp: new Date().toISOString(),
		});
	});

	app.on(["GET", "POST"], "/api/auth/*", (c) => {
		return runtime.auth.handler(c.req.raw);
	});

	return app
		.route("/api/users", usersRouter)
		.route("/api/listings", listingsRouter)
		.route("/api/claims", claimsRouter);
}

export type AppType = ReturnType<typeof createApp>;
