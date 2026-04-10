import { Pool } from "pg";
import { beforeEach } from "vitest";

/**
 * Test setup file - runs before each test file
 * Provides database cleanup and test utilities
 */

// Test database connection pool
let testPool: Pool | null = null;
let isDatabaseAvailable: boolean | null = null;

/**
 * Check if database is available
 */
async function checkDatabaseAvailability(): Promise<boolean> {
	if (isDatabaseAvailable !== null) {
		return isDatabaseAvailable;
	}

	if (process.env.DB_SKIP === "true") {
		isDatabaseAvailable = false;
		return false;
	}

	try {
		const pool = getTestPool();
		await pool.query("SELECT 1");
		isDatabaseAvailable = true;
		return true;
	} catch {
		isDatabaseAvailable = false;
		process.env.DB_SKIP = "true";
		return false;
	}
}

/**
 * Get or create the test database pool
 */
export function getTestPool(): Pool {
	if (!testPool) {
		const url = process.env.DB_URL;
		if (!url) {
			throw new Error("No DB_URL env var configured");
		}

		// @ts-expect-error - Pool can accept connection string as first arg
		testPool = new Pool(url);
	}
	return testPool;
}

/**
 * Clean up all data in test tables
 * Skips if database is unavailable
 */
export async function cleanupTestData(): Promise<void> {
	if (!(await checkDatabaseAvailability())) {
		return;
	}
	const pool = getTestPool();
	await pool.query(`
		DELETE FROM claims;
		DELETE FROM listings;
		DELETE FROM users;
	`);
}

/**
 * Insert test users
 * Skips if database is unavailable
 */
export async function insertTestUsers(
	users: Array<{
		id: string;
		name: string;
		email: string;
		role?: string;
	}>,
): Promise<void> {
	if (!(await checkDatabaseAvailability())) {
		return;
	}
	const pool = getTestPool();
	for (const user of users) {
		await pool.query(
			`INSERT INTO users (id, name, email, role)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (id) DO NOTHING`,
			[user.id, user.name, user.email, user.role || "student"],
		);
	}
}

/**
 * Insert test listings
 * Skips if database is unavailable
 */
export async function insertTestListings(
	listings: Array<{
		id: string;
		host_id: string;
		host_name: string;
		title: string;
		quantity: number;
		quantity_remaining: number;
		expires_at: Date;
		status?: string;
		building_name?: string;
		room_number?: string;
		lat?: number;
		lng?: number;
	}>,
): Promise<void> {
	if (!(await checkDatabaseAvailability())) {
		return;
	}
	const pool = getTestPool();
	for (const listing of listings) {
		await pool.query(
			`INSERT INTO listings (
				id, host_id, host_name, title,
				quantity, quantity_remaining, expires_at, status,
				building_name, room_number, lat, lng
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (id) DO NOTHING`,
			[
				listing.id,
				listing.host_id,
				listing.host_name,
				listing.title,
				listing.quantity,
				listing.quantity_remaining,
				listing.expires_at,
				listing.status || "active",
				listing.building_name || null,
				listing.room_number || null,
				listing.lat || null,
				listing.lng || null,
			],
		);
	}
}

/**
 * Insert test claims
 * Skips if database is unavailable
 */
export async function insertTestClaims(
	claims: Array<{
		id: string;
		listing_id: string;
		student_id: string;
		student_name: string;
		quantity: number;
		reservation_expires_at: Date;
		status?: string;
		rating?: number;
	}>,
): Promise<void> {
	if (!(await checkDatabaseAvailability())) {
		return;
	}
	const pool = getTestPool();
	for (const claim of claims) {
		await pool.query(
			`INSERT INTO claims (
				id, listing_id, student_id, student_name,
				quantity, reservation_expires_at, status, rating
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (id) DO NOTHING`,
			[
				claim.id,
				claim.listing_id,
				claim.student_id,
				claim.student_name,
				claim.quantity,
				claim.reservation_expires_at,
				claim.status || "pending",
				claim.rating || null,
			],
		);
	}
}

// Clean up before each test file
beforeEach(async () => {
	await cleanupTestData();
});

// Clean up after all tests
process.on("exit", async () => {
	if (testPool) {
		await testPool.end();
		testPool = null;
	}
});
