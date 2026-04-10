export async function readErrorMessage(
	response: Response,
	fallback: string,
): Promise<string> {
	try {
		const payload = await response.json();
		if (
			payload &&
			typeof payload === "object" &&
			"message" in payload &&
			typeof payload.message === "string"
		) {
			return payload.message;
		}
		if (
			payload &&
			typeof payload === "object" &&
			"error" in payload &&
			typeof payload.error === "string"
		) {
			return payload.error;
		}
	} catch (error) {
		console.warn("Failed to parse API error response:", error);
	}

	return fallback;
}
