import type { RuntimeConfig } from "./config";

export interface EmailPayload {
	to: string;
	subject: string;
	html: string;
}

export type EmailSender = (payload: EmailPayload) => Promise<void>;

export function createEmailSender(
	config: Pick<RuntimeConfig, "resendApiKey" | "fromEmail">,
): EmailSender {
	return async (payload) => {
		if (!config.resendApiKey) {
			console.warn("RESEND_API_KEY is not configured; skipping email send.");
			return;
		}

		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${config.resendApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: config.fromEmail,
				to: payload.to,
				subject: payload.subject,
				html: payload.html,
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to send email: ${await response.text()}`);
		}
	};
}
