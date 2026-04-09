import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { createEmailSender } from "./email";

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

export interface Env {
	SUPABASE_DB_URL: string;
	RESEND_API_KEY: string;
	BETTER_AUTH_SECRET: string;
	ENVIRONMENT: string;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const sendEmail = createEmailSender(env.RESEND_API_KEY);

		const auth = betterAuth({
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
					expiresIn: 300, // 5 minutes
					disableSignUp: false,
				}),
			],
			session: {
				expiresIn: 60 * 60 * 24 * 7, // 7 days
				updateAge: 60 * 60 * 24, // Update session once per day
			},
			trustedOrigins: [
				"http://localhost:8081",
				"http://localhost:3000",
				"ecoeats://",
			],
		});

		try {
			return await auth.handler(request);
		} catch (error) {
			console.error("Auth handler error:", error);
			return new Response(JSON.stringify({ error: "Internal server error" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	},
};
