import { Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { describe, expect, it } from "vitest";

describe("rate limiting middleware", () => {
	it("should have rateLimiter import available", () => {
		expect(rateLimiter).toBeDefined();
		expect(typeof rateLimiter).toBe("function");
	});

	it("should apply rate limiting with correct configuration", async () => {
		const app = new Hono();

		// Apply rate limiting middleware
		app.use(
			"/api/*",
			rateLimiter({
				windowMs: 15 * 60 * 1000, // 15 minutes
				limit: 100, // 100 requests per window
				keyGenerator: (c) =>
					c.req.header("x-forwarded-for") ??
					c.req.header("cf-connecting-ip") ??
					"unknown",
			}),
		);

		app.get("/api/test", (c) => c.json({ message: "success" }));

		// Test request includes rate limit headers
		const res = await app.request("/api/test", {
			headers: { "x-forwarded-for": "127.0.0.1" },
		});

		expect(res.status).toBe(200);
		// Check rate limit headers are present (IETF standard)
		expect(res.headers.has("ratelimit-limit")).toBe(true);
		expect(res.headers.has("ratelimit-remaining")).toBe(true);
		expect(res.headers.has("ratelimit-reset")).toBe(true);
		expect(res.headers.has("ratelimit-policy")).toBe(true);
	});

	it("should return 429 when rate limit exceeded", async () => {
		const app = new Hono();

		// Very restrictive rate limit for testing
		app.use(
			"/api/*",
			rateLimiter({
				windowMs: 60000, // 1 minute
				limit: 1, // Only 1 request
				keyGenerator: () => "test-client",
			}),
		);

		app.get("/api/test", (c) => c.json({ message: "success" }));

		// First request should succeed
		const res1 = await app.request("/api/test");
		expect(res1.status).toBe(200);

		// Second request should be rate limited
		const res2 = await app.request("/api/test");
		expect(res2.status).toBe(429);
	});

	it("should not apply rate limiting to health endpoint", async () => {
		const app = new Hono();

		// Health endpoint BEFORE rate limiting
		app.get("/health", (c) => c.json({ status: "ok" }));

		// Rate limiting for API routes only
		app.use(
			"/api/*",
			rateLimiter({
				windowMs: 60000,
				limit: 1,
				keyGenerator: () => "test-client",
			}),
		);

		app.get("/api/test", (c) => c.json({ message: "success" }));

		// First API request
		const apiRes1 = await app.request("/api/test");
		expect(apiRes1.status).toBe(200);

		// Health should still work even after API is rate limited
		const healthRes = await app.request("/health");
		expect(healthRes.status).toBe(200);
		expect(await healthRes.json()).toEqual({ status: "ok" });

		// Second API request should fail
		const apiRes2 = await app.request("/api/test");
		expect(apiRes2.status).toBe(429);
	});
});
