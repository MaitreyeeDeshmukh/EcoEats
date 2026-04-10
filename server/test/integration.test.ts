/**
 * Integration Tests
 *
 * These tests verify cross-cutting concerns and system-level behavior
 * across multiple modules:
 * - Claim and listing status consistency
 * - Concurrent claims race conditions
 * - End-to-end claim workflows
 */

import { Hono } from "hono";
import type { Pool } from "pg";
import { beforeEach, describe, expect, it } from "vitest";
import { createClaimsRouter } from "../routes/claims";
import { createListingsRouter } from "../routes/listings";
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
} from "./index";

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

describe("Integration: Claim and Listing Status Consistency", () => {
	let db: Pool;

	beforeEach(async () => {
		await cleanupTestData();
	});

	itIf(
		isDbAvailable,
		"listing status changes to 'claimed' when quantity becomes zero (VAL-TEST-098)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();
			const listingId = generateTestId();

			// Create test data
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
					quantity: 3,
					quantity_remaining: 3,
					expires_at: futureMinutes(60),
					status: "active",
				},
			]);

			// Create app with both routers
			const app = new Hono<AppEnv>();
			app.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(studentId)),
			);

			// Claim all 3 portions
			const res = await app.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: "Student",
					quantity: 3,
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

	itIf(
		isDbAvailable,
		"no-show restores listing status to 'active' and quantity (VAL-TEST-098)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();
			const listingId = generateTestId();
			const claimId = generateTestId();

			// Create test data - listing with quantity=0 (all claimed)
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
					quantity: 5,
					quantity_remaining: 0,
					expires_at: futureMinutes(60),
					status: "claimed", // Already claimed
				},
			]);
			await insertTestClaims([
				{
					id: claimId,
					listing_id: listingId,
					student_id: studentId,
					student_name: "Student",
					quantity: 5,
					reservation_expires_at: futureMinutes(20),
					status: "pending",
				},
			]);

			const app = new Hono<AppEnv>();
			app.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(hostId)),
			);

			// Mark as no-show
			const res = await app.request(`/claims/${claimId}/no-show`, {
				method: "POST",
			});

			expect(res.status).toBe(200);

			// Verify claim status
			const claimResult = await db.query(
				"SELECT status FROM claims WHERE id = $1",
				[claimId],
			);
			expect(claimResult.rows[0].status).toBe("no_show");

			// Verify listing status restored to 'active' and quantity restored
			const listingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("active");
			expect(listingResult.rows[0].quantity_remaining).toBe(5);
		},
	);

	itIf(
		isDbAvailable,
		"multiple claims reduce quantity until zero then status changes (VAL-TEST-098)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const listingId = generateTestId();

			// Create 3 students to make claims
			const students = [
				{ id: generateTestId(), name: "Student 1", email: "s1@example.com" },
				{ id: generateTestId(), name: "Student 2", email: "s2@example.com" },
				{ id: generateTestId(), name: "Student 3", email: "s3@example.com" },
			];

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				...students,
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Test Listing",
					quantity: 3,
					quantity_remaining: 3,
					expires_at: futureMinutes(60),
					status: "active",
				},
			]);

			// First student claims 1
			const app1 = new Hono<AppEnv>();
			app1.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(students[0].id)),
			);
			const res1 = await app1.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: students[0].name,
					quantity: 1,
				}),
			});
			expect(res1.status).toBe(201);

			let listingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("active");
			expect(listingResult.rows[0].quantity_remaining).toBe(2);

			// Second student claims 1
			const app2 = new Hono<AppEnv>();
			app2.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(students[1].id)),
			);
			const res2 = await app2.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: students[1].name,
					quantity: 1,
				}),
			});
			expect(res2.status).toBe(201);

			listingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("active");
			expect(listingResult.rows[0].quantity_remaining).toBe(1);

			// Third student claims 1 (last portion)
			const app3 = new Hono<AppEnv>();
			app3.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(students[2].id)),
			);
			const res3 = await app3.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: students[2].name,
					quantity: 1,
				}),
			});
			expect(res3.status).toBe(201);

			// Now listing should be claimed (quantity = 0)
			listingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("claimed");
			expect(listingResult.rows[0].quantity_remaining).toBe(0);
		},
	);

	itIf(
		isDbAvailable,
		"no-show on partial claim restores only claimed quantity (VAL-TEST-098)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const student1Id = generateTestId();
			const student2Id = generateTestId();
			const listingId = generateTestId();
			const claimId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: student1Id, name: "Student 1", email: "s1@example.com" },
				{ id: student2Id, name: "Student 2", email: "s2@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Test Listing",
					quantity: 5,
					quantity_remaining: 3, // 2 claimed
					expires_at: futureMinutes(60),
					status: "active",
				},
			]);
			await insertTestClaims([
				{
					id: claimId,
					listing_id: listingId,
					student_id: student1Id,
					student_name: "Student 1",
					quantity: 2,
					reservation_expires_at: futureMinutes(20),
					status: "pending",
				},
			]);

			const app = new Hono<AppEnv>();
			app.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(hostId)),
			);

			// Mark as no-show (restores 2 portions)
			const res = await app.request(`/claims/${claimId}/no-show`, {
				method: "POST",
			});

			expect(res.status).toBe(200);

			// Verify quantity increased by 2 (the claim quantity), not reset to 5
			const listingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("active");
			expect(listingResult.rows[0].quantity_remaining).toBe(5); // 3 + 2 = 5
		},
	);
});

describe("Integration: Concurrent Claims Race Condition", () => {
	let db: Pool;

	beforeEach(async () => {
		await cleanupTestData();
	});

	itIf(
		isDbAvailable,
		"only one claim succeeds when two request last item simultaneously (VAL-TEST-099)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const student1Id = generateTestId();
			const student2Id = generateTestId();
			const listingId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: student1Id, name: "Student 1", email: "s1@example.com" },
				{ id: student2Id, name: "Student 2", email: "s2@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Only One Item",
					quantity: 1,
					quantity_remaining: 1, // Only 1 item!
					expires_at: futureMinutes(60),
					status: "active",
				},
			]);

			// Create two apps for two different students
			const app1 = new Hono<AppEnv>();
			app1.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(student1Id)),
			);

			const app2 = new Hono<AppEnv>();
			app2.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(student2Id)),
			);

			// Fire both requests simultaneously
			const [res1, res2] = await Promise.all([
				app1.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student 1",
						quantity: 1,
					}),
				}),
				app2.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: "Student 2",
						quantity: 1,
					}),
				}),
			]);

			// One should succeed, one should fail
			const statuses = [res1.status, res2.status];
			expect(statuses).toContain(201); // One success
			expect(statuses).toContain(400); // One failure

			// Find the failed response
			const failedRes = res1.status === 400 ? res1 : res2;
			const failedJson = await failedRes.json();
			expect(failedJson.message).toBe("Not enough portions remaining");

			// Verify only one claim was created
			const claimsResult = await db.query(
				"SELECT COUNT(*) as count FROM claims WHERE listing_id = $1",
				[listingId],
			);
			expect(parseInt(claimsResult.rows[0].count, 10)).toBe(1);

			// Verify listing is claimed (quantity = 0)
			const listingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("claimed");
			expect(listingResult.rows[0].quantity_remaining).toBe(0);
		},
	);

	itIf(
		isDbAvailable,
		"multiple concurrent claims respect quantity limits (VAL-TEST-099)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const listingId = generateTestId();

			// Create 5 students
			const students = Array.from({ length: 5 }, (_, i) => ({
				id: generateTestId(),
				name: `Student ${i + 1}`,
				email: `s${i + 1}@example.com`,
			}));

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				...students,
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Limited Items",
					quantity: 3,
					quantity_remaining: 3, // Only 3 items
					expires_at: futureMinutes(60),
					status: "active",
				},
			]);

			// All 5 students try to claim 1 each simultaneously
			const requests = students.map((student) => {
				const app = new Hono<AppEnv>();
				app.route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(student.id)),
				);
				return app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: student.name,
						quantity: 1,
					}),
				});
			});

			const responses = await Promise.all(requests);

			// Count successes and failures
			const successes = responses.filter((r) => r.status === 201).length;
			const failures = responses.filter((r) => r.status === 400).length;

			// Exactly 3 should succeed, 2 should fail
			expect(successes).toBe(3);
			expect(failures).toBe(2);

			// Verify exactly 3 claims were created
			const claimsResult = await db.query(
				"SELECT COUNT(*) as count FROM claims WHERE listing_id = $1",
				[listingId],
			);
			expect(parseInt(claimsResult.rows[0].count, 10)).toBe(3);

			// Verify listing is claimed (quantity = 0)
			const listingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("claimed");
			expect(listingResult.rows[0].quantity_remaining).toBe(0);
		},
	);

	itIf(
		isDbAvailable,
		"concurrent claims with different quantities handle overflow correctly (VAL-TEST-099)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const student1Id = generateTestId();
			const student2Id = generateTestId();
			const student3Id = generateTestId();
			const listingId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: student1Id, name: "Student 1", email: "s1@example.com" },
				{ id: student2Id, name: "Student 2", email: "s2@example.com" },
				{ id: student3Id, name: "Student 3", email: "s3@example.com" },
			]);
			await insertTestListings([
				{
					id: listingId,
					host_id: hostId,
					host_name: "Host",
					title: "Test Listing",
					quantity: 5,
					quantity_remaining: 5,
					expires_at: futureMinutes(60),
					status: "active",
				},
			]);

			// Three students try to claim: 2, 2, 2 (total 6 > 5 available)
			const students = [
				{ id: student1Id, name: "Student 1" },
				{ id: student2Id, name: "Student 2" },
				{ id: student3Id, name: "Student 3" },
			];

			const requests = students.map((student) => {
				const app = new Hono<AppEnv>();
				app.route(
					"/claims",
					createClaimsRouter(db, createMockRequireSession(student.id)),
				);
				return app.request("/claims", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						listingId,
						studentName: student.name,
						quantity: 2,
					}),
				});
			});

			const responses = await Promise.all(requests);

			// Should allow at most 2 full claims (2+2=4), third gets rejected
			const successes = responses.filter((r) => r.status === 201).length;
			const failures = responses.filter((r) => r.status === 400).length;

			expect(successes + failures).toBe(3);

			// Verify total claimed quantity does not exceed original quantity
			const claimsResult = await db.query(
				"SELECT COALESCE(SUM(quantity), 0) as total FROM claims WHERE listing_id = $1",
				[listingId],
			);
			const totalClaimed = parseInt(claimsResult.rows[0].total, 10);
			expect(totalClaimed).toBeLessThanOrEqual(5);
		},
	);
});

describe("Integration: End-to-End Claim Workflow", () => {
	let db: Pool;

	beforeEach(async () => {
		await cleanupTestData();
	});

	itIf(
		isDbAvailable,
		"complete workflow: create listing, claim, confirm pickup (integration)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const studentId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: studentId, name: "Student", email: "student@example.com" },
			]);

			// Create listings app to create a listing
			const listingsApp = new Hono<AppEnv>();
			listingsApp.route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(hostId)),
			);

			// Host creates a listing
			const createRes = await listingsApp.request("/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					hostName: "Test Host",
					hostBuilding: "Building A",
					title: "Pizza Party Leftovers",
					description: "Lots of pizza left!",
					foodItems: ["Pepperoni Pizza", "Cheese Pizza"],
					quantity: 10,
					dietaryTags: [],
					imageUrl: null,
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
					},
				}),
			});

			expect(createRes.status).toBe(201);
			const { data: listingData } = await createRes.json();
			const listingId = listingData.id;

			// Student claims 3 portions
			const claimsApp = new Hono<AppEnv>();
			claimsApp.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(studentId)),
			);

			const claimRes = await claimsApp.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: "Student",
					quantity: 3,
				}),
			});

			expect(claimRes.status).toBe(201);
			const { data: claimData } = await claimRes.json();
			const claimId = claimData.id;

			// Verify listing quantity reduced
			const listingResult = await db.query(
				"SELECT quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].quantity_remaining).toBe(7);

			// Host confirms pickup
			const hostClaimsApp = new Hono<AppEnv>();
			hostClaimsApp.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(hostId)),
			);

			const confirmRes = await hostClaimsApp.request(
				`/claims/${claimId}/confirm-pickup`,
				{
					method: "POST",
				},
			);

			expect(confirmRes.status).toBe(200);

			// Verify claim is picked up
			const claimResult = await db.query(
				"SELECT status FROM claims WHERE id = $1",
				[claimId],
			);
			expect(claimResult.rows[0].status).toBe("picked_up");

			// Student rates the claim
			const rateRes = await claimsApp.request(`/claims/${claimId}/rating`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rating: 5 }),
			});

			expect(rateRes.status).toBe(200);

			// Verify rating saved
			const ratingResult = await db.query(
				"SELECT rating FROM claims WHERE id = $1",
				[claimId],
			);
			expect(ratingResult.rows[0].rating).toBe(5);
		},
	);

	itIf(
		isDbAvailable,
		"complete workflow: create listing, claim, no-show, re-claim (integration)",
		async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const student1Id = generateTestId();
			const student2Id = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host", email: "host@example.com" },
				{ id: student1Id, name: "Student 1", email: "s1@example.com" },
				{ id: student2Id, name: "Student 2", email: "s2@example.com" },
			]);

			// Create listings app
			const listingsApp = new Hono<AppEnv>();
			listingsApp.route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(hostId)),
			);

			// Host creates a listing with 1 item
			const createRes = await listingsApp.request("/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					hostName: "Test Host",
					hostBuilding: "Building A",
					title: "Single Item",
					description: "Only one available!",
					foodItems: ["Special Item"],
					quantity: 1,
					dietaryTags: [],
					imageUrl: null,
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
					},
				}),
			});

			expect(createRes.status).toBe(201);
			const { data: listingData } = await createRes.json();
			const listingId = listingData.id;

			// Student 1 claims the item
			const claimsApp1 = new Hono<AppEnv>();
			claimsApp1.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(student1Id)),
			);

			const claimRes = await claimsApp1.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: "Student 1",
					quantity: 1,
				}),
			});

			expect(claimRes.status).toBe(201);
			const { data: claimData } = await claimRes.json();
			const claimId = claimData.id;

			// Verify listing is now claimed
			const initialListingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(initialListingResult.rows[0].status).toBe("claimed");
			expect(initialListingResult.rows[0].quantity_remaining).toBe(0);

			// Student 2 tries to claim but can't (no more items)
			const claimsApp2 = new Hono<AppEnv>();
			claimsApp2.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(student2Id)),
			);

			const failedClaimRes = await claimsApp2.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: "Student 2",
					quantity: 1,
				}),
			});

			expect(failedClaimRes.status).toBe(400);
			const failedJson = await failedClaimRes.json();
			expect(failedJson.message).toBe("Listing is no longer active");

			// Host marks Student 1 as no-show
			const hostClaimsApp = new Hono<AppEnv>();
			hostClaimsApp.route(
				"/claims",
				createClaimsRouter(db, createMockRequireSession(hostId)),
			);

			const noShowRes = await hostClaimsApp.request(
				`/claims/${claimId}/no-show`,
				{
					method: "POST",
				},
			);

			expect(noShowRes.status).toBe(200);

			// Verify listing is now active again
			const activeListingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(activeListingResult.rows[0].status).toBe("active");
			expect(activeListingResult.rows[0].quantity_remaining).toBe(1);

			// Student 2 can now claim
			const reclaimRes = await claimsApp2.request("/claims", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					studentName: "Student 2",
					quantity: 1,
				}),
			});

			expect(reclaimRes.status).toBe(201);

			// Verify listing is claimed again
			const finalListingResult = await db.query(
				"SELECT status, quantity_remaining FROM listings WHERE id = $1",
				[listingId],
			);
			expect(finalListingResult.rows[0].status).toBe("claimed");
			expect(finalListingResult.rows[0].quantity_remaining).toBe(0);
		},
	);
});
