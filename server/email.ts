import { serverConfig } from "./config";

interface EmailPayload {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
	if (!serverConfig.resendApiKey) {
		console.warn("RESEND_API_KEY is not configured; skipping email send.");
		return;
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${serverConfig.resendApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: serverConfig.fromEmail,
			to: payload.to,
			subject: payload.subject,
			html: payload.html,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to send email: ${await response.text()}`);
	}
}
