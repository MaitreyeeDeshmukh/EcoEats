/**
 * Test helper functions for server route tests
 * Extracted from listings.test.ts and claims.test.ts to avoid duplication
 */

import { Hono } from "hono";
import type { Pool } from "pg";
import { it } from "vitest";
import { messageResponseSchema } from "../../shared/contracts";
import { HttpError } from "../errors";
import { createClaimsRouter } from "../routes/claims";
import { createListingsRouter } from "../routes/listings";
import type { AppEnv } from "../session";
import { futureMinutes, generateTestId } from "./index";

/**
 * Create a mock requireSession middleware for testing
 */
export function createMockRequireSession(userId: string): any {
	return async (c: any, next: any) => {
		c.set("authSession", {
			user: {
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
				role: "student",
			},
			session: {
				id: generateTestId(),
				userId,
				expiresAt: futureMinutes(60).toISOString(),
			},
		});
		await next();
	};
}

/**
 * Conditional test helper - runs test only if condition is true
 */
export function itIf(
	condition: boolean,
	name: string,
	fn: () => Promise<void>,
) {
	if (condition) {
		it(name, fn);
	} else {
		it.skip(name, fn);
	}
}

/**
 * Helper to create test app with error handling for typed errors (mirrors app.ts)
 */
export function createTestApp(db: Pool, requireSession: any): Hono<AppEnv> {
	const app = new Hono<AppEnv>().route(
		"/listings",
		createListingsRouter(db, requireSession),
	);
	// Error handler for typed errors (mirrors app.ts)
	app.onError((err, c) => {
		if (err instanceof HttpError) {
			return c.json(
				messageResponseSchema.parse({ message: err.message }),
				err.statusCode as 400 | 401 | 404 | 409 | 500,
			);
		}
		throw err;
	});
	return app;
}

/**
 * Helper to create test app for claims routes
 */
export function createTestClaimsApp(
	db: Pool,
	requireSession: any,
): Hono<AppEnv> {
	return new Hono<AppEnv>().route(
		"/claims",
		createClaimsRouter(db, requireSession),
	);
}
