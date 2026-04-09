interface EmailPayload {
	to: string;
	subject: string;
	html: string;
}

export function createEmailSender(apiKey: string) {
	return async function sendEmail(payload: EmailPayload): Promise<void> {
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: "EcoEats <noreply@ecoeats.app>",
				to: payload.to,
				subject: payload.subject,
				html: payload.html,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to send email: ${error}`);
		}
	};
}
