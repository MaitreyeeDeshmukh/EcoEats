import { AuthError, NetworkError, ValidationError } from "./errors";

describe("ValidationError", () => {
	it("can be instantiated with a message", () => {
		const error = new ValidationError("Invalid email format");
		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe("Invalid email format");
	});

	it("has name property set to 'ValidationError'", () => {
		const error = new ValidationError("Invalid input");
		expect(error.name).toBe("ValidationError");
	});

	it("extends native Error class", () => {
		const error = new ValidationError("Test error");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(ValidationError);
	});

	it("preserves the error message", () => {
		const message = "Title must be at least 3 characters";
		const error = new ValidationError(message);
		expect(error.message).toBe(message);
	});

	it("preserves stack trace in development", () => {
		const error = new ValidationError("Test error");
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("ValidationError");
	});
});

describe("AuthError", () => {
	it("can be instantiated with a message", () => {
		const error = new AuthError("Session expired");
		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe("Session expired");
	});

	it("has name property set to 'AuthError'", () => {
		const error = new AuthError("Authentication failed");
		expect(error.name).toBe("AuthError");
	});

	it("extends native Error class", () => {
		const error = new AuthError("Test error");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(AuthError);
	});

	it("preserves the error message", () => {
		const message = "Invalid magic link token";
		const error = new AuthError(message);
		expect(error.message).toBe(message);
	});

	it("preserves stack trace in development", () => {
		const error = new AuthError("Test error");
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("AuthError");
	});
});

describe("NetworkError", () => {
	it("can be instantiated with a message", () => {
		const error = new NetworkError("Failed to fetch");
		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe("Failed to fetch");
	});

	it("has name property set to 'NetworkError'", () => {
		const error = new NetworkError("Connection timeout");
		expect(error.name).toBe("NetworkError");
	});

	it("extends native Error class", () => {
		const error = new NetworkError("Test error");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(NetworkError);
	});

	it("preserves the error message", () => {
		const message = "No internet connection";
		const error = new NetworkError(message);
		expect(error.message).toBe(message);
	});

	it("preserves stack trace in development", () => {
		const error = new NetworkError("Test error");
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("NetworkError");
	});
});
