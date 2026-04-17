const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
	const trimmed = email.trim();
	if (!trimmed) {
		return "Email is required";
	}
	if (!EMAIL_REGEX.test(trimmed)) {
		return "Invalid email format";
	}
	return null;
}
