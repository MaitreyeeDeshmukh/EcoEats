import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";
import { serverConfig, validateServerConfig } from "./config";
import { claimsRouter } from "./routes/claims";
import { listingsRouter } from "./routes/listings";
import { usersRouter } from "./routes/users";
import type { AppEnv } from "./session";

validateServerConfig();

export const app = new Hono<AppEnv>({
	strict: false,
});

app.use("*", logger());
app.use(
	"*",
	cors({
		origin: (origin) => {
			if (!origin) {
				return serverConfig.allowedOrigins[0];
			}

			if (
				serverConfig.allowedOrigins.some((allowedOrigin) =>
					origin.startsWith(allowedOrigin),
				)
			) {
				return origin;
			}

			return serverConfig.allowedOrigins[0];
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
	return auth.handler(c.req.raw);
});

export const routes = app
	.route("/api/users", usersRouter)
	.route("/api/listings", listingsRouter)
	.route("/api/claims", claimsRouter);

export type AppType = typeof routes;
