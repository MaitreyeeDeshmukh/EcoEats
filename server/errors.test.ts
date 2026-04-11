import { describe, expect, it } from "vitest";
import {
	ConflictError,
	HttpError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "./errors";

describe("error classes", () => {
	describe("HttpError", () => {
		it("can be instantiated with message and statusCode", () => {
			const error = new HttpError("Test error", 500);
			expect(error.message).toBe("Test error");
			expect(error.statusCode).toBe(500);
			expect(error.name).toBe("HttpError");
		});

		it("extends native Error class", () => {
			const error = new HttpError("Test", 500);
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(HttpError);
		});

		it("preserves stack trace in development", () => {
			const error = new HttpError("Test", 500);
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("HttpError");
		});
	});

	describe("NotFoundError", () => {
		it("can be instantiated with a message", () => {
			const error = new NotFoundError("User not found");
			expect(error.message).toBe("User not found");
		});

		it("has default message when none provided", () => {
			const error = new NotFoundError();
			expect(error.message).toBe("Not found");
		});

		it("has name property set to 'NotFoundError'", () => {
			const error = new NotFoundError("Test");
			expect(error.name).toBe("NotFoundError");
		});

		it("has statusCode property set to 404", () => {
			const error = new NotFoundError("Test");
			expect(error.statusCode).toBe(404);
		});

		it("extends native Error class", () => {
			const error = new NotFoundError("Test");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(HttpError);
			expect(error).toBeInstanceOf(NotFoundError);
		});

		it("preserves stack trace in development", () => {
			const error = new NotFoundError("Test");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("NotFoundError");
		});
	});

	describe("ConflictError", () => {
		it("can be instantiated with a message", () => {
			const error = new ConflictError("Already claimed");
			expect(error.message).toBe("Already claimed");
		});

		it("has default message when none provided", () => {
			const error = new ConflictError();
			expect(error.message).toBe("Conflict");
		});

		it("has name property set to 'ConflictError'", () => {
			const error = new ConflictError("Test");
			expect(error.name).toBe("ConflictError");
		});

		it("has statusCode property set to 409", () => {
			const error = new ConflictError("Test");
			expect(error.statusCode).toBe(409);
		});

		it("extends native Error class", () => {
			const error = new ConflictError("Test");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(HttpError);
			expect(error).toBeInstanceOf(ConflictError);
		});

		it("preserves stack trace in development", () => {
			const error = new ConflictError("Test");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("ConflictError");
		});
	});

	describe("ValidationError", () => {
		it("can be instantiated with a message", () => {
			const error = new ValidationError("Invalid email format");
			expect(error.message).toBe("Invalid email format");
		});

		it("has default message when none provided", () => {
			const error = new ValidationError();
			expect(error.message).toBe("Validation failed");
		});

		it("has name property set to 'ValidationError'", () => {
			const error = new ValidationError("Test");
			expect(error.name).toBe("ValidationError");
		});

		it("has statusCode property set to 400", () => {
			const error = new ValidationError("Test");
			expect(error.statusCode).toBe(400);
		});

		it("extends native Error class", () => {
			const error = new ValidationError("Test");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(HttpError);
			expect(error).toBeInstanceOf(ValidationError);
		});

		it("preserves stack trace in development", () => {
			const error = new ValidationError("Test");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("ValidationError");
		});
	});

	describe("UnauthorizedError", () => {
		it("can be instantiated with a message", () => {
			const error = new UnauthorizedError("Session expired");
			expect(error.message).toBe("Session expired");
		});

		it("has default message when none provided", () => {
			const error = new UnauthorizedError();
			expect(error.message).toBe("Unauthorized");
		});

		it("has name property set to 'UnauthorizedError'", () => {
			const error = new UnauthorizedError("Test");
			expect(error.name).toBe("UnauthorizedError");
		});

		it("has statusCode property set to 401", () => {
			const error = new UnauthorizedError("Test");
			expect(error.statusCode).toBe(401);
		});

		it("extends native Error class", () => {
			const error = new UnauthorizedError("Test");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(HttpError);
			expect(error).toBeInstanceOf(UnauthorizedError);
		});

		it("preserves stack trace in development", () => {
			const error = new UnauthorizedError("Test");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("UnauthorizedError");
		});
	});
});
