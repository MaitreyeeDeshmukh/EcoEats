/**
 * Error class for form/input validation failures.
 * Thrown when user input fails validation checks.
 */
export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

/**
 * Error class for authentication failures.
 * Thrown when authentication operations fail (e.g., invalid credentials, expired session).
 */
export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthError";
	}
}

/**
 * Error class for network request failures.
 * Thrown when network requests fail due to connectivity issues, timeouts, or server errors.
 */
export class NetworkError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NetworkError";
	}
}
