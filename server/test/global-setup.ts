import { Pool } from "pg";

/**
 * Global setup for Vitest test suite
 * Runs once before all test files
 */
export default async function setup() {
	// Check if we should skip database setup
	if (process.env.SKIP_DB_TESTS === "true") {
		console.log("\n⚠️  Skipping database setup (SKIP_DB_TESTS=true)\n");
		return;
	}

	const url = process.env.DB_URL;
	if (!url) {
		console.warn("\n⚠️  No DB_URL env var. Database tests will be skipped.\n");
		process.env.DB_SKIP = "true";
		return;
	}

	console.log("\n🧪 Setting up test database...");

	const pool = new Pool({ connectionString: url });

	try {
		// Clean and set up test tables
		await pool.query(`
			-- Drop existing test tables if they exist (in reverse dependency order)
			DROP TABLE IF EXISTS claims CASCADE;
			DROP TABLE IF EXISTS listings CASCADE;
			DROP TABLE IF EXISTS users CASCADE;
		`);

		// Create tables with the app schema
		await pool.query(`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				email TEXT NOT NULL UNIQUE,
				avatar_url TEXT,
				role TEXT NOT NULL DEFAULT 'student'
					CHECK (role IN ('student', 'organizer')),
				dietary_prefs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
				impact_stats JSONB NOT NULL DEFAULT '{"mealsRescued":0,"co2Saved":0,"pointsEarned":0}'::jsonb,
				reputation_score INTEGER NOT NULL DEFAULT 100,
				last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			);

			CREATE TABLE IF NOT EXISTS listings (
				id TEXT PRIMARY KEY,
				host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				host_name TEXT NOT NULL,
				host_building TEXT,
				title TEXT NOT NULL,
				description TEXT,
				food_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
				quantity INTEGER NOT NULL CHECK (quantity > 0),
				quantity_remaining INTEGER NOT NULL CHECK (quantity_remaining >= 0),
				dietary_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
				image_url TEXT,
				building_name TEXT,
				room_number TEXT,
				lat DOUBLE PRECISION,
				lng DOUBLE PRECISION,
				expiry_minutes INTEGER NOT NULL DEFAULT 90,
				expires_at TIMESTAMPTZ NOT NULL,
				posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				status TEXT NOT NULL DEFAULT 'active'
					CHECK (status IN ('active', 'claimed', 'expired', 'cancelled'))
			);

			CREATE TABLE IF NOT EXISTS claims (
				id TEXT PRIMARY KEY,
				listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
				student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				student_name TEXT NOT NULL,
				quantity INTEGER NOT NULL CHECK (quantity > 0),
				claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				picked_up_at TIMESTAMPTZ,
				status TEXT NOT NULL DEFAULT 'pending'
					CHECK (status IN ('pending', 'picked_up', 'no_show')),
				reservation_expires_at TIMESTAMPTZ NOT NULL,
				rating INTEGER CHECK (rating BETWEEN 1 AND 5),
				UNIQUE (listing_id, student_id)
			);

			CREATE INDEX IF NOT EXISTS listings_status_expires_idx
				ON listings (status, expires_at DESC);
			CREATE INDEX IF NOT EXISTS claims_student_claimed_idx
				ON claims (student_id, claimed_at DESC);
			CREATE INDEX IF NOT EXISTS claims_listing_claimed_idx
				ON claims (listing_id, claimed_at DESC);
		`);

		console.log("✅ Test database setup complete\n");
	} catch (error) {
		console.warn("\n⚠️  Database setup failed:", (error as Error).message);
		console.warn("Tests requiring database will be skipped.\n");
		// Mark tests to skip DB-dependent tests
		process.env.DB_SKIP = "true";
	} finally {
		await pool.end();
	}
}
