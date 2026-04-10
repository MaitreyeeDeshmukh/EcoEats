import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";
import { magicLink } from "better-auth/plugins/magic-link";
import { serverConfig, validateServerConfig } from "./config";
import { pool } from "./db";
import { sendEmail } from "./email";

validateServerConfig();

export const auth = betterAuth({
	database: pool,
	secret: serverConfig.authSecret,
	baseURL: serverConfig.apiUrl,
	basePath: "/api/auth",
	trustedOrigins: serverConfig.allowedOrigins,
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

export type AuthSession = typeof auth.$Infer.Session;
