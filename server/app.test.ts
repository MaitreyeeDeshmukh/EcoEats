import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { messageResponseSchema } from "../shared/contracts";
import {
	ConflictError,
	HttpError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "./errors";
import type { AppEnv } from "./session";

describe("error handler middleware", () => {
	/**
	 * Create a test app with the same error handler as createApp
	 */
	function createTestAppWithErrorHandler(): Hono<AppEnv> {
		const app = new Hono<AppEnv>({ strict: false });

		// Add the same error handler as createApp
		app.onError((err, c) => {
			if (err instanceof HttpError) {
				return c.json(
					messageResponseSchema.parse({ message: err.message }),
					err.statusCode as 400 | 401 | 404 | 409 | 500,
				);
			}
			// Return generic 500 for unknown errors without statusCode
			return c.json(
				messageResponseSchema.parse({ message: "Internal Server Error" }),
				500,
			);
		});

		return app;
	}

	describe("catches typed errors and returns correct status codes", () => {
		it("catches NotFoundError and returns 404 status (VAL-ERR-019)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new NotFoundError("User not found");
			});

			const res = await app.request("/test");
			expect(res.status).toBe(404);

			const body = await res.json();
			expect(body).toEqual({ message: "User not found" });
		});

		it("catches ConflictError and returns 409 status (VAL-ERR-019)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new ConflictError("Already claimed");
			});

			const res = await app.request("/test");
			expect(res.status).toBe(409);

			const body = await res.json();
			expect(body).toEqual({ message: "Already claimed" });
		});

		it("catches ValidationError and returns 400 status (VAL-ERR-019)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new ValidationError("Invalid input");
			});

			const res = await app.request("/test");
			expect(res.status).toBe(400);

			const body = await res.json();
			expect(body).toEqual({ message: "Invalid input" });
		});

		it("catches UnauthorizedError and returns 401 status (VAL-ERR-019)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new UnauthorizedError("Session expired");
			});

			const res = await app.request("/test");
			expect(res.status).toBe(401);

			const body = await res.json();
			expect(body).toEqual({ message: "Session expired" });
		});

		it("catches generic HttpError and returns correct status code (VAL-ERR-019)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new HttpError("Custom error", 418);
			});

			const res = await app.request("/test");
			expect(res.status).toBe(418);

			const body = await res.json();
			expect(body).toEqual({ message: "Custom error" });
		});
	});

	describe("returns generic 500 for unknown errors", () => {
		it("returns 500 for generic Error instances (VAL-ERR-020)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new Error("Something went wrong");
			});

			const res = await app.request("/test");
			expect(res.status).toBe(500);

			const body = await res.json();
			expect(body).toEqual({ message: "Internal Server Error" });
		});

		it("returns 500 for custom errors without statusCode (VAL-ERR-020)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				class CustomError extends Error {
					constructor(message: string) {
						super(message);
						this.name = "CustomError";
					}
				}
				throw new CustomError("Custom error without status");
			});

			const res = await app.request("/test");
			expect(res.status).toBe(500);

			const body = await res.json();
			expect(body).toEqual({ message: "Internal Server Error" });
		});

		it("returns 500 for runtime errors (VAL-ERR-020)", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new TypeError("Cannot read property of undefined");
			});

			const res = await app.request("/test");
			expect(res.status).toBe(500);

			const body = await res.json();
			expect(body).toEqual({ message: "Internal Server Error" });
		});

	});

	describe("error responses follow messageResponseSchema format", () => {
		it("typed errors return response matching messageResponseSchema", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new ValidationError("Invalid input");
			});

			const res = await app.request("/test");
			const body = await res.json();

			// Should match the schema: { message: string }
			expect(body).toHaveProperty("message");
			expect(typeof body.message).toBe("string");
			expect(body).not.toHaveProperty("success");
			expect(body).not.toHaveProperty("error");
		});

		it("generic 500 errors return response matching messageResponseSchema", async () => {
			const app = createTestAppWithErrorHandler();
			app.get("/test", () => {
				throw new Error("Unknown error");
			});

			const res = await app.request("/test");
			const body = await res.json();

			// Should match the schema: { message: string }
			expect(body).toHaveProperty("message");
			expect(typeof body.message).toBe("string");
			expect(body).not.toHaveProperty("success");
			expect(body).not.toHaveProperty("error");
		});
	});
});
