import { describe, expect, it } from "vitest";
import {
	cleanupTestData,
	getTestPoolOrThrow,
	insertTestUsers,
	isDbAvailable,
} from "./index";

/**
 * Conditional test helper - runs test only if condition is true
 */
function itIf(condition: boolean, name: string, fn: () => Promise<void>) {
	if (condition) {
		it(name, fn);
	} else {
		it.skip(name, fn);
	}
}

describe("Test Environment Setup", () => {
	itIf(isDbAvailable, "should connect to the test database", async () => {
		const pool = getTestPoolOrThrow();
		const result = await pool.query("SELECT 1 as test");
		expect(result.rows[0].test).toBe(1);
	});

	itIf(isDbAvailable, "should clean up test data", async () => {
		await cleanupTestData();
		const pool = getTestPoolOrThrow();

		const users = await pool.query("SELECT * FROM users");
		expect(users.rows).toHaveLength(0);

		const listings = await pool.query("SELECT * FROM listings");
		expect(listings.rows).toHaveLength(0);

		const claims = await pool.query("SELECT * FROM claims");
		expect(claims.rows).toHaveLength(0);
	});

	itIf(isDbAvailable, "should insert and retrieve test users", async () => {
		await cleanupTestData();
		await insertTestUsers([
			{
				id: "test-user-1",
				name: "Test User 1",
				email: "test1@example.com",
				role: "student",
			},
			{
				id: "test-user-2",
				name: "Test User 2",
				email: "test2@example.com",
				role: "organizer",
			},
		]);

		const pool = getTestPoolOrThrow();
		const result = await pool.query("SELECT * FROM users ORDER BY email");

		expect(result.rows).toHaveLength(2);
		expect(result.rows[0].name).toBe("Test User 1");
		expect(result.rows[1].role).toBe("organizer");
	});

	it("should have NODE_ENV set to test", () => {
		expect(process.env.NODE_ENV).toBe("test");
	});
});
