import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { createEmailSender } from "./email";

type Bindings = {
	SUPABASE_DB_URL: string;
	RESEND_API_KEY: string;
	BETTER_AUTH_SECRET: string;
	ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.use(
	"*",
	cors({
		origin: (origin) => {
			const allowed = [
				"ecoeats://",
				"http://localhost:8081",
				"http://localhost:3000",
				"http://localhost:8787",
			];
			if (allowed.some((o) => origin.startsWith(o))) return origin;
			return allowed[0];
		},
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		credentials: true,
	}),
);

app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		environment: c.env.ENVIRONMENT,
	});
});

function createAuth(env: Bindings) {
	const sendEmail = createEmailSender(env.RESEND_API_KEY);

	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL:
			env.ENVIRONMENT === "development"
				? "http://localhost:8787"
				: "https://auth.ecoeats.app",
		database: {
			provider: "postgres",
			url: env.SUPABASE_DB_URL,
		},
		plugins: [
			magicLink({
				sendMagicLink: async ({ email, token, url }) => {
					const deepLinkUrl = `ecoeats://auth/callback?token=${encodeURIComponent(token)}`;
					const webLink = new URL(url);
					webLink.searchParams.set("token", token);
					const webUrl = webLink.toString();

					await sendEmail({
						to: email,
						subject: "Sign in to EcoEats",
						html: `
              <h1>Sign in to EcoEats</h1>
              <p>Click the link below to sign in:</p>
              <p><a href="${webUrl}">Sign in on web</a></p>
              <p>Or open this link in the EcoEats app: ${deepLinkUrl}</p>
              <p>This link expires in 5 minutes.</p>
            `,
					});
				},
				expiresIn: 300,
				disableSignUp: false,
			}),
		],
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
		},
		trustedOrigins: [
			"http://localhost:8081",
			"http://localhost:3000",
			"ecoeats://",
		],
	});
}

app.on(["GET", "POST"], "/auth/*", (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

export default app;
