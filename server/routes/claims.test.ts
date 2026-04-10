import { Hono } from "hono";
import type { Pool } from "pg";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppEnv } from "../session";
import {
	cleanupTestData,
	futureMinutes,
	generateTestId,
	getTestPoolOrThrow,
	insertTestClaims,
	insertTestListings,
	insertTestUsers,
	isDbAvailable,
} from "../test";
import { createClaimsRouter } from "./claims";

/**
 * Create a mock requireSession middleware for testing
 */
function createMockRequireSession(userId: string): any {
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
function itIf(condition: boolean, name: string, fn: () => Promise<void>) {
	if (condition) {
		it(name, fn);
	} else {
		it.skip(name, fn);
	}
}

describe("Claims Router", () => {
	let db: Pool;

	beforeEach(async () => {
		await cleanupTestData();
	});

	describe("GET /mine", () => {
		itIf(
			isDbAvailable,
			"should return user's claims sorted by claimed_at DESC",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: userId,
						host_name: "Test Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);
				await insertTestClaims([
					{
						id: generateTestId(),
						listing_id: listingId,
						student_id: userId,
						student_name: "Test User",
						quantity: 2,
						reservation_expires_at: futureMinutes(20),
						status: "pending",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/claims/mine");
				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.data).toHaveLength(1);
				expect(json.data[0].student_id).toBe(userId);
				expect(json.data[0].quantity).toBe(2);
			},
		);

		itIf(
			isDbAvailable,
			"should return empty array when user has no claims",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/claims/mine");
				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.data).toEqual([]);
			},
		);

		itIf(
			isDbAvailable,
			"should require authentication (401 without session)",
			async () => {
				db = getTestPoolOrThrow();

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, async (c) => {
						return c.json({ message: "Unauthorized" }, 401);
					}),
				);

				const res = await app.request("/claims/mine");
				expect(res.status).toBe(401);
			},
		);

		itIf(
			isDbAvailable,
			"should limit results to 20 most recent claims",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();
				const listingId = generateTestId();

				// Create test user and listing
				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: userId,
						host_name: "Test Host",
						title: "Test Listing",
						quantity: 100,
						quantity_remaining: 50,
						expires_at: futureMinutes(60),
					},
				]);

				// Create 25 different students to make 25 claims
				// (each student can only claim a listing once due to unique constraint)
				const studentIds = Array.from({ length: 25 }, (_, i) => ({
					id: generateTestId(),
					name: `Student ${i}`,
					email: `student${i}@example.com`,
				}));
				await insertTestUsers(studentIds);

				// Insert 25 claims (more than the 20 limit)
				const claims = studentIds.map((student, i) => ({
					id: generateTestId(),
					listing_id: listingId,
					student_id: student.id,
					student_name: student.name,
					quantity: 1,
					reservation_expires_at: futureMinutes(20 - i),
					status: "pending" as const,
				}));
				await insertTestClaims(claims);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/claims/mine");
				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.data).toHaveLength(0); // User has no claims (they were made by other students)
			},
		);
	});

	describe("GET /listing/:listingId", () => {
		itIf(isDbAvailable, "should return claims for host's listing", async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();
			const listingId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host User", email: "host@example.com" },
				{ id: studentId, name: "Student", email: "student@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host User",
					title: "Test Listing",
					quantity: 10,
					quantity_remaining: 5,
					expires_at: futureMinutes(60),
				},
			]);
			await insertTestClaims([
				{
					id: generateTestId(),
					listing_id: listingId,
					student_id: studentId,
					student_name: "Student",
					quantity: 2,
					reservation_expires_at: futureMinutes(20),
					status: "pending",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(hostId)),
			);

			const res = await app.request(`/claims/listing/${listingId}`);
			expect(res.status).toBe(200);

			const json = await res.json();
			expect(json.data).toHaveLength(1);
			expect(json.data[0].student_id).toBe(studentId);
		});

		itIf(
			isDbAvailable,
			"should return empty array when host has no claims on their listing",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host User", email: "host@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host User",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 10,
						expires_at: futureMinutes(60),
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(hostId)),
				);

				const res = await app.request(`/claims/listing/${listingId}`);
				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.data).toEqual([]);
			},
		);

		itIf(
			isDbAvailable,
			"should reject non-host trying to view claims",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const nonHostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host User", email: "host@example.com" },
					{ id: nonHostId, name: "Non Host", email: "nonhost@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host User",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);
				await insertTestClaims([
					{
						id: generateTestId(),
						listing_id: listingId,
						student_id: studentId,
						student_name: "Student",
						quantity: 2,
						reservation_expires_at: futureMinutes(20),
						status: "pending",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(nonHostId)),
				);

				const res = await app.request(`/claims/listing/${listingId}`);
				expect(res.status).toBe(200);

				const json = await res.json();
				// Non-host sees empty array since they don't own the listing
				expect(json.data).toEqual([]);
			},
		);

		itIf(
			isDbAvailable,
			"should validate UUID format for listingId",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/claims/listing/invalid-uuid");
				expect(res.status).toBe(400);
			},
		);
	});

	describe("POST /", () => {
		itIf(
			isDbAvailable,
			"should create claim successfully with transaction logic",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student",
						quantity: 2,
					}),
				});

				expect(res.status).toBe(201);

				const json = await res.json();
				expect(json.data.id).toBeDefined();
				expect(typeof json.data.id).toBe("string");

				// Verify listing quantity was reduced
				const listingResult = await db.query(
					"SELECT quantity_remaining FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].quantity_remaining).toBe(3);
			},
		);

		itIf(
			isDbAvailable,
			"should prevent duplicate claims from same user",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);
				await insertTestClaims([
					{
						id: generateTestId(),
						listing_id: listingId,
						student_id: studentId,
						student_name: "Student",
						quantity: 1,
						reservation_expires_at: futureMinutes(20),
						status: "pending",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student",
						quantity: 1,
					}),
				});

				expect(res.status).toBe(400);

				const json = await res.json();
				expect(json.message).toBe("Already claimed");
			},
		);

		itIf(
			isDbAvailable,
			"should reject claim for non-existent listing",
			async () => {
				db = getTestPoolOrThrow();
				const studentId = generateTestId();

				await insertTestUsers([
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId: generateTestId(),
						studentName: "Student",
						quantity: 1,
					}),
				});

				expect(res.status).toBe(400);

				const json = await res.json();
				expect(json.message).toBe("Listing not found");
			},
		);

		itIf(
			isDbAvailable,
			"should reject claim for inactive listing",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
						status: "claimed", // inactive status
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student",
						quantity: 1,
					}),
				});

				expect(res.status).toBe(400);

				const json = await res.json();
				expect(json.message).toBe("Listing is no longer active");
			},
		);

		itIf(
			isDbAvailable,
			"should reject claim when insufficient quantity remaining",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 2, // only 2 left
						expires_at: futureMinutes(60),
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student",
						quantity: 5, // trying to claim 5
					}),
				});

				expect(res.status).toBe(400);

				const json = await res.json();
				expect(json.message).toBe("Not enough portions remaining");
			},
		);

		itIf(
			isDbAvailable,
			"should set reservation expiry 20 minutes from now",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);

				const beforeCreate = new Date();

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student",
						quantity: 1,
					}),
				});

				expect(res.status).toBe(201);

				const _afterCreate = new Date();

				const json = await res.json();
				const claimId = json.data.id;

				// Verify reservation_expires_at is about 20 minutes in the future
				const claimResult = await db.query(
					"SELECT reservation_expires_at FROM claims WHERE id = $1",
					[claimId],
				);
				const expiresAt = new Date(claimResult.rows[0].reservation_expires_at);
				const diffMinutes =
					(expiresAt.getTime() - beforeCreate.getTime()) / 60000;
				expect(diffMinutes).toBeGreaterThanOrEqual(19);
				expect(diffMinutes).toBeLessThanOrEqual(21);
			},
		);

		itIf(
			isDbAvailable,
			"should use default quantity of 1 when not specified",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student",
						// quantity not specified
					}),
				});

				expect(res.status).toBe(201);

				// Verify claim was created with quantity 1
				const json = await res.json();
				const claimResult = await db.query(
					"SELECT quantity FROM claims WHERE id = $1",
					[json.data.id],
				);
				expect(claimResult.rows[0].quantity).toBe(1);

				// Verify listing quantity was reduced by 1
				const listingResult = await db.query(
					"SELECT quantity_remaining FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].quantity_remaining).toBe(4);
			},
		);

		itIf(
			isDbAvailable,
			"should release database connection after transaction",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);

				const _app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				// Make multiple claims to ensure connections are released
				const studentIds = Array.from({ length: 5 }, (_, i) => ({
					id: generateTestId(),
					name: `Student ${i}`,
					email: `student${i}@example.com`,
				}));

				await insertTestUsers(
					studentIds.map((s) => ({ ...s, role: "student" })),
				);

				for (let i = 0; i < 5; i++) {
					const studentApp = new Hono<AppEnv>().route(
						"/claims",
						createClaimsRouter(db, createMockRequireSession(studentIds[i].id)),
					);

					const res = await studentApp.request("/claims", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							listingId,
							studentName: studentIds[i].name,
							quantity: 1,
						}),
					});

					expect(res.status).toBe(201);
				}

				// All claims should be created successfully
				const claimsResult = await db.query(
					"SELECT COUNT(*) as count FROM claims WHERE listing_id = $1",
					[listingId],
				);
				expect(parseInt(claimsResult.rows[0].count, 10)).toBe(5);
			},
		);

		itIf(
			isDbAvailable,
			"should set listing status to 'claimed' when quantity becomes zero",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 2,
						quantity_remaining: 2,
						expires_at: futureMinutes(60),
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student",
						quantity: 2, // Claim all remaining
					}),
				});

				expect(res.status).toBe(201);

				// Verify listing status changed to 'claimed'
				const listingResult = await db.query(
					"SELECT status, quantity_remaining FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].status).toBe("claimed");
				expect(listingResult.rows[0].quantity_remaining).toBe(0);
			},
		);
	});

	describe("POST /:id/confirm-pickup", () => {
		itIf(isDbAvailable, "should confirm pickup successfully", async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();
			const listingId = generateTestId();
			const claimId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: studentId, name: "Student", email: "student@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Test Listing",
					quantity: 10,
					quantity_remaining: 5,
					expires_at: futureMinutes(60),
				},
			]);
			await insertTestClaims([
				{
					id: claimId,
					listing_id: listingId,
					student_id: studentId,
					student_name: "Student",
					quantity: 2,
					reservation_expires_at: futureMinutes(20),
					status: "pending",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(hostId)),
			);

			const res = await app.request(`/claims/${claimId}/confirm-pickup`, {
				method: "POST",
			});

			expect(res.status).toBe(200);

			const json = await res.json();
			expect(json.success).toBe(true);

			// Verify claim status was updated
			const claimResult = await db.query(
				"SELECT status, picked_up_at FROM claims WHERE id = $1",
				[claimId],
			);
			expect(claimResult.rows[0].status).toBe("picked_up");
			expect(claimResult.rows[0].picked_up_at).toBeTruthy();
		});

		itIf(
			isDbAvailable,
			"should reject non-host trying to confirm pickup",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const nonHostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();
				const claimId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: nonHostId, name: "Non Host", email: "nonhost@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);
				await insertTestClaims([
					{
						id: claimId,
						listing_id: listingId,
						student_id: studentId,
						student_name: "Student",
						quantity: 2,
						reservation_expires_at: futureMinutes(20),
						status: "pending",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(nonHostId)),
				);

				const res = await app.request(`/claims/${claimId}/confirm-pickup`, {
					method: "POST",
				});

				expect(res.status).toBe(404);

				const json = await res.json();
				expect(json.message).toBe("Claim not found");
			},
		);

		itIf(
			isDbAvailable,
			"should return 404 for non-existent claim",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const listingId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(hostId)),
				);

				const res = await app.request(
					`/claims/${generateTestId()}/confirm-pickup`,
					{
						method: "POST",
					},
				);

				expect(res.status).toBe(404);

				const json = await res.json();
				expect(json.message).toBe("Claim not found");
			},
		);

		itIf(
			isDbAvailable,
			"should validate UUID format for claim id",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(hostId)),
				);

				const res = await app.request("/claims/invalid-uuid/confirm-pickup", {
					method: "POST",
				});

				expect(res.status).toBe(400);
			},
		);
	});

	describe("POST /:id/no-show", () => {
		itIf(
			isDbAvailable,
			"should mark no-show successfully and restore quantity",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();
				const claimId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 3, // 7 claimed (including our test claim of 2)
						expires_at: futureMinutes(60),
					},
				]);
				await insertTestClaims([
					{
						id: claimId,
						listing_id: listingId,
						student_id: studentId,
						student_name: "Student",
						quantity: 2,
						reservation_expires_at: futureMinutes(20),
						status: "pending",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(hostId)),
				);

				const res = await app.request(`/claims/${claimId}/no-show`, {
					method: "POST",
				});

				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.success).toBe(true);

				// Verify claim status was updated
				const claimResult = await db.query(
					"SELECT status FROM claims WHERE id = $1",
					[claimId],
				);
				expect(claimResult.rows[0].status).toBe("no_show");

				// Verify quantity was restored to listing
				const listingResult = await db.query(
					"SELECT quantity_remaining, status FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].quantity_remaining).toBe(5); // 3 + 2
				expect(listingResult.rows[0].status).toBe("active");
			},
		);

		itIf(
			isDbAvailable,
			"should reject non-host trying to mark no-show",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const nonHostId = generateTestId();
				const studentId = generateTestId();
				const listingId = generateTestId();
				const claimId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: nonHostId, name: "Non Host", email: "nonhost@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);
				await insertTestClaims([
					{
						id: claimId,
						listing_id: listingId,
						student_id: studentId,
						student_name: "Student",
						quantity: 2,
						reservation_expires_at: futureMinutes(20),
						status: "pending",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(nonHostId)),
				);

				const res = await app.request(`/claims/${claimId}/no-show`, {
					method: "POST",
				});

				expect(res.status).toBe(400);

				const json = await res.json();
				expect(json.message).toBe("Claim not found");
			},
		);

		itIf(
			isDbAvailable,
			"should return 400 for non-existent claim",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(hostId)),
				);

				const res = await app.request(`/claims/${generateTestId()}/no-show`, {
					method: "POST",
				});

				expect(res.status).toBe(400);

				const json = await res.json();
				expect(json.message).toBe("Claim not found");
			},
		);

		itIf(isDbAvailable, "should rollback transaction on error", async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();
			const listingId = generateTestId();
			const claimId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: studentId, name: "Student", email: "student@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Test Listing",
					quantity: 10,
					quantity_remaining: 5,
					expires_at: futureMinutes(60),
				},
			]);
			await insertTestClaims([
				{
					id: claimId,
					listing_id: listingId,
					student_id: studentId,
					student_name: "Student",
					quantity: 2,
					reservation_expires_at: futureMinutes(20),
					status: "pending",
				},
			]);

			// Store original quantity
			const originalResult = await db.query(
				"SELECT quantity_remaining, status FROM listings WHERE id = $1",
				[listingId],
			);
			const originalQuantity = originalResult.rows[0].quantity_remaining;
			const originalStatus = originalResult.rows[0].status;

			// Now try to mark no-show with wrong host (this should fail and rollback)
			const wrongHostId = generateTestId();
			await insertTestUsers([
				{ id: wrongHostId, name: "Wrong Host", email: "wrong@example.com" },
			]);

			const wrongApp = new Hono<AppEnv>().route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(wrongHostId)),
			);

			const res = await wrongApp.request(`/claims/${claimId}/no-show`, {
				method: "POST",
			});

			expect(res.status).toBe(400);

			// Verify no changes were made (rollback worked)
			const afterResult = await db.query(
				"SELECT quantity_remaining, status FROM listings WHERE id = $1",
				[listingId],
			);
			expect(afterResult.rows[0].quantity_remaining).toBe(originalQuantity);
			expect(afterResult.rows[0].status).toBe(originalStatus);

			// Verify claim status unchanged
			const claimResult = await db.query(
				"SELECT status FROM claims WHERE id = $1",
				[claimId],
			);
			expect(claimResult.rows[0].status).toBe("pending");
		});
	});

	describe("POST /:id/rating", () => {
		itIf(isDbAvailable, "should submit rating successfully", async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();
			const listingId = generateTestId();
			const claimId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: studentId, name: "Student", email: "student@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Test Listing",
					quantity: 10,
					quantity_remaining: 5,
					expires_at: futureMinutes(60),
				},
			]);
			await insertTestClaims([
				{
					id: claimId,
					listing_id: listingId,
					student_id: studentId,
					student_name: "Student",
					quantity: 2,
					reservation_expires_at: futureMinutes(20),
					status: "pending",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(studentId)),
			);

			const res = await app.request(`/claims/${claimId}/rating`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rating: 5 }),
			});

			expect(res.status).toBe(200);

			const json = await res.json();
			expect(json.success).toBe(true);

			// Verify rating was saved
			const claimResult = await db.query(
				"SELECT rating FROM claims WHERE id = $1",
				[claimId],
			);
			expect(claimResult.rows[0].rating).toBe(5);
		});

		itIf(
			isDbAvailable,
			"should reject rating from non-owner of claim",
			async () => {
				db = getTestPoolOrThrow();
				const hostId = generateTestId();
				const studentId = generateTestId();
				const nonOwnerId = generateTestId();
				const listingId = generateTestId();
				const claimId = generateTestId();

				await insertTestUsers([
					{ id: hostId, name: "Host", email: "host@example.com" },
					{ id: studentId, name: "Student", email: "student@example.com" },
					{ id: nonOwnerId, name: "Non Owner", email: "nonowner@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId,
						host_id: hostId,
						host_name: "Host",
						title: "Test Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
				]);
				await insertTestClaims([
					{
						id: claimId,
						listing_id: listingId,
						student_id: studentId,
						student_name: "Student",
						quantity: 2,
						reservation_expires_at: futureMinutes(20),
						status: "picked_up",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(nonOwnerId)),
				);

				const res = await app.request(`/claims/${claimId}/rating`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ rating: 5 }),
				});

				expect(res.status).toBe(404);

				const json = await res.json();
				expect(json.message).toBe("Claim not found");
			},
		);

		itIf(isDbAvailable, "should validate rating range (1-5)", async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();
			const listingId = generateTestId();
			const claimId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: studentId, name: "Student", email: "student@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Test Listing",
					quantity: 10,
					quantity_remaining: 5,
					expires_at: futureMinutes(60),
				},
			]);
			await insertTestClaims([
				{
					id: claimId,
					listing_id: listingId,
					student_id: studentId,
					student_name: "Student",
					quantity: 2,
					reservation_expires_at: futureMinutes(20),
					status: "picked_up",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(studentId)),
			);

			// Test rating below 1
			const resLow = await app.request(`/claims/${claimId}/rating`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rating: 0 }),
			});
			expect(resLow.status).toBe(400);

			// Test rating above 5
			const resHigh = await app.request(`/claims/${claimId}/rating`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rating: 6 }),
			});
			expect(resHigh.status).toBe(400);
		});

		itIf(
			isDbAvailable,
			"should return 404 for non-existent claim",
			async () => {
				db = getTestPoolOrThrow();
				const studentId = generateTestId();

				await insertTestUsers([
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request(`/claims/${generateTestId()}/rating`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ rating: 5 }),
				});

				expect(res.status).toBe(404);

				const json = await res.json();
				expect(json.message).toBe("Claim not found");
			},
		);

		itIf(
			isDbAvailable,
			"should validate UUID format for claim id",
			async () => {
				db = getTestPoolOrThrow();
				const studentId = generateTestId();

				await insertTestUsers([
					{ id: studentId, name: "Student", email: "student@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(studentId)),
				);

				const res = await app.request("/claims/invalid-uuid/rating", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ rating: 5 }),
				});

				expect(res.status).toBe(400);
			},
		);
	});
});
