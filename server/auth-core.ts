import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";
import { magicLink } from "better-auth/plugins/magic-link";
import type { Pool } from "pg";
import type { RuntimeConfig } from "./config";
import type { EmailSender } from "./email";

interface CreateAuthOptions {
	config: RuntimeConfig;
	database: Pool;
	sendEmail: EmailSender;
}

export function createAuth({ config, database, sendEmail }: CreateAuthOptions) {
	return betterAuth({
		database,
		secret: config.authSecret,
		baseURL: config.apiUrl,
		basePath: "/api/auth",
		trustedOrigins: config.allowedOrigins,
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
		},
		plugins: [
			bearer(),
			magicLink({
				expiresIn: 300,
				disableSignUp: false,
				sendMagicLink: async ({ email, token, url }) => {
					const deepLinkUrl = `ecoeats://auth/callback?token=${encodeURIComponent(token)}`;
					const webLink = new URL(url);
					webLink.searchParams.set("token", token);

					await sendEmail({
						to: email,
						subject: "Sign in to EcoEats",
						html: `
							<h1>Sign in to EcoEats</h1>
							<p>Click the link below to sign in:</p>
							<p><a href="${webLink.toString()}">Sign in on web</a></p>
							<p>Or open this link in the EcoEats app: ${deepLinkUrl}</p>
							<p>This link expires in 5 minutes.</p>
						`,
					});
				},
			}),
		],
	});
}

export type AppAuth = ReturnType<typeof createAuth>;
export type AuthSession = AppAuth["$Infer"]["Session"];
