import type { Context, MiddlewareHandler, Next } from "hono";
import type { AppEnv } from "../session";

/**
 * Test utilities export
 * Provides database fixtures and helper functions for server tests
 */

export {
	cleanupTestData,
	getTestPool,
	getTestPoolOrThrow,
	insertTestClaims,
	insertTestListings,
	insertTestUsers,
	isDbAvailable,
} from "./setup";

/**
 * Generate a UUID v4 string for test IDs
 */
export function generateTestId(): string {
	return crypto.randomUUID();
}

/**
 * Create a mock session for testing
 */
export function createMockSession(userId: string) {
	return {
		user: {
			id: userId,
			name: "Test User",
			email: `test-${userId}@example.com`,
			role: "student",
		},
		session: {
			id: generateTestId(),
			userId,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
		},
	};
}

/**
 * Create a mock requireSession middleware for testing
 */
export function createMockRequireSession(
	userId: string,
): MiddlewareHandler<AppEnv> {
	return async (c: Context<AppEnv>, next: Next) => {
		c.set(
			"authSession",
			createMockSession(
				userId,
			) as unknown as AppEnv["Variables"]["authSession"],
		);
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
 * Helper to create a future date
 */
export function futureMinutes(minutes: number): Date {
	return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Helper to create a past date
 */
export function pastMinutes(minutes: number): Date {
	return new Date(Date.now() - minutes * 60 * 1000);
}
