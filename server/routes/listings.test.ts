import { Hono } from "hono";
import type { Pool } from "pg";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppEnv } from "../session";
import {
	cleanupTestData,
	futureMinutes,
	generateTestId,
	getTestPoolOrThrow,
	insertTestListings,
	insertTestUsers,
	isDbAvailable,
	pastMinutes,
} from "../test";
import { createListingsRouter } from "./listings";

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

describe("Listings Router", () => {
	let db: Pool;

	beforeEach(async () => {
		await cleanupTestData();
	});

	describe("GET /", () => {
		itIf(
			isDbAvailable,
			"should return active listings ordered by posted_at DESC",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();
				const listingId1 = generateTestId();
				const listingId2 = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);
				await insertTestListings([
					{
						id: listingId1,
						host_id: userId,
						host_name: "Test Host",
						title: "First Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
					},
					{
						id: listingId2,
						host_id: userId,
						host_name: "Test Host",
						title: "Second Listing",
						quantity: 8,
						quantity_remaining: 3,
						expires_at: futureMinutes(45),
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/listings");
				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.data).toHaveLength(2);
				// Should be ordered by posted_at DESC (most recent first)
				expect(json.data[0].title).toBe("Second Listing");
				expect(json.data[1].title).toBe("First Listing");
			},
		);

		itIf(
			isDbAvailable,
			"should auto-expire stale listings before returning results",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();
				const activeListingId = generateTestId();
				const expiredListingId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);
				await insertTestListings([
					{
						id: activeListingId,
						host_id: userId,
						host_name: "Test Host",
						title: "Active Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: futureMinutes(60),
						status: "active",
					},
					{
						id: expiredListingId,
						host_id: userId,
						host_name: "Test Host",
						title: "Expired Listing",
						quantity: 5,
						quantity_remaining: 2,
						expires_at: pastMinutes(10),
						status: "active", // Still marked as active but expired
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/listings");
				expect(res.status).toBe(200);

				const json = await res.json();
				// Only active listing should be returned
				expect(json.data).toHaveLength(1);
				expect(json.data[0].id).toBe(activeListingId);

				// Verify the expired listing status was updated in database
				const expiredResult = await db.query(
					"SELECT status FROM listings WHERE id = $1",
					[expiredListingId],
				);
				expect(expiredResult.rows[0].status).toBe("expired");
			},
		);

		itIf(
			isDbAvailable,
			"should return empty array when no active listings exist",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/listings");
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
					"/listings",
					createListingsRouter(db, async (c) => {
						return c.json({ message: "Unauthorized" }, 401);
					}),
				);

				const res = await app.request("/listings");
				expect(res.status).toBe(401);
			},
		);

		itIf(isDbAvailable, "should limit results to 50 listings", async () => {
			db = getTestPoolOrThrow();
			const userId = generateTestId();

			await insertTestUsers([
				{ id: userId, name: "Test User", email: "test@example.com" },
			]);

			// Create 55 listings (more than the 50 limit)
			const listings = Array.from({ length: 55 }, (_, i) => ({
				id: generateTestId(),
				host_id: userId,
				host_name: "Test Host",
				title: `Listing ${i}`,
				quantity: 10,
				quantity_remaining: 5,
				expires_at: futureMinutes(60),
			}));
			await insertTestListings(listings);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			const res = await app.request("/listings");
			expect(res.status).toBe(200);

			const json = await res.json();
			expect(json.data).toHaveLength(50);
		});
	});

	describe("GET /:id", () => {
		itIf(isDbAvailable, "should return single listing by ID", async () => {
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
					building_name: "Building A",
					room_number: "101",
					lat: 40.7128,
					lng: -74.006,
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			const res = await app.request(`/listings/${listingId}`);
			expect(res.status).toBe(200);

			const json = await res.json();
			expect(json.data.id).toBe(listingId);
			expect(json.data.title).toBe("Test Listing");
			expect(json.data.host_name).toBe("Test Host");
			expect(json.data.building_name).toBe("Building A");
			expect(json.data.room_number).toBe("101");
			expect(json.data.lat).toBe(40.7128);
			expect(json.data.lng).toBe(-74.006);
		});

		itIf(
			isDbAvailable,
			"should return 404 for non-existent listing",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request(`/listings/${generateTestId()}`);
				expect(res.status).toBe(404);

				const json = await res.json();
				expect(json.message).toBe("Listing not found");
			},
		);

		itIf(
			isDbAvailable,
			"should return listing regardless of status (expired, cancelled, claimed)",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();
				const expiredListingId = generateTestId();
				const cancelledListingId = generateTestId();
				const claimedListingId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);
				await insertTestListings([
					{
						id: expiredListingId,
						host_id: userId,
						host_name: "Test Host",
						title: "Expired Listing",
						quantity: 10,
						quantity_remaining: 5,
						expires_at: pastMinutes(10),
						status: "expired",
					},
					{
						id: cancelledListingId,
						host_id: userId,
						host_name: "Test Host",
						title: "Cancelled Listing",
						quantity: 8,
						quantity_remaining: 3,
						expires_at: futureMinutes(30),
						status: "cancelled",
					},
					{
						id: claimedListingId,
						host_id: userId,
						host_name: "Test Host",
						title: "Claimed Listing",
						quantity: 5,
						quantity_remaining: 0,
						expires_at: futureMinutes(20),
						status: "claimed",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				// Test expired listing
				const res1 = await app.request(`/listings/${expiredListingId}`);
				expect(res1.status).toBe(200);
				const json1 = await res1.json();
				expect(json1.data.status).toBe("expired");

				// Test cancelled listing
				const res2 = await app.request(`/listings/${cancelledListingId}`);
				expect(res2.status).toBe(200);
				const json2 = await res2.json();
				expect(json2.data.status).toBe("cancelled");

				// Test claimed listing
				const res3 = await app.request(`/listings/${claimedListingId}`);
				expect(res3.status).toBe(200);
				const json3 = await res3.json();
				expect(json3.data.status).toBe("claimed");
			},
		);

		itIf(isDbAvailable, "should validate UUID parameter format", async () => {
			db = getTestPoolOrThrow();
			const userId = generateTestId();

			await insertTestUsers([
				{ id: userId, name: "Test User", email: "test@example.com" },
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			const res = await app.request("/listings/invalid-uuid");
			expect(res.status).toBe(400);
		});
	});

	describe("POST /", () => {
		itIf(
			isDbAvailable,
			"should create listing successfully with all fields",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const listingData = {
					hostName: "Test Host",
					hostBuilding: "Building A",
					title: "Fresh Pizza",
					description: "Delicious leftover pizza",
					foodItems: ["Pepperoni Pizza", "Cheese Pizza"],
					quantity: 10,
					dietaryTags: ["vegetarian-available", "halal"],
					imageUrl: "https://example.com/pizza.jpg",
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
						roomNumber: "201",
					},
					expiryMinutes: 120,
				};

				const res = await app.request("/listings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(listingData),
				});

				expect(res.status).toBe(201);

				const json = await res.json();
				expect(json.data.id).toBeDefined();
				expect(typeof json.data.id).toBe("string");

				// Verify listing was created with all fields
				const listingResult = await db.query(
					`SELECT * FROM listings WHERE id = $1`,
					[json.data.id],
				);
				expect(listingResult.rows[0]).toMatchObject({
					host_id: userId,
					host_name: "Test Host",
					host_building: "Building A",
					title: "Fresh Pizza",
					description: "Delicious leftover pizza",
					food_items: ["Pepperoni Pizza", "Cheese Pizza"],
					quantity: 10,
					quantity_remaining: 10,
					dietary_tags: ["vegetarian-available", "halal"],
					image_url: "https://example.com/pizza.jpg",
					building_name: "Student Center",
					room_number: "201",
					lat: 40.7128,
					lng: -74.006,
					expiry_minutes: 120,
					status: "active",
				});
			},
		);

		itIf(
			isDbAvailable,
			"should use default expiry of 90 minutes when not specified",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const beforeCreate = new Date();

				const res = await app.request("/listings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hostName: "Test Host",
						hostBuilding: "Building A",
						title: "Fresh Pizza",
						description: "Delicious pizza",
						foodItems: ["Pizza"],
						quantity: 5,
						dietaryTags: [],
						imageUrl: null,
						location: {
							lat: 40.7128,
							lng: -74.006,
							buildingName: "Student Center",
						},
						// expiryMinutes not specified
					}),
				});

				expect(res.status).toBe(201);

				const json = await res.json();
				const listingId = json.data.id;

				// Verify default expiry was used
				const listingResult = await db.query(
					"SELECT expiry_minutes, expires_at FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].expiry_minutes).toBe(90);

				// Verify expires_at is approximately 90 minutes in the future
				const expiresAt = new Date(listingResult.rows[0].expires_at);
				const diffMinutes =
					(expiresAt.getTime() - beforeCreate.getTime()) / 60000;
				expect(diffMinutes).toBeGreaterThanOrEqual(89);
				expect(diffMinutes).toBeLessThanOrEqual(91);
			},
		);

		itIf(isDbAvailable, "should store location data correctly", async () => {
			db = getTestPoolOrThrow();
			const userId = generateTestId();

			await insertTestUsers([
				{ id: userId, name: "Test User", email: "test@example.com" },
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			const res = await app.request("/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					hostName: "Test Host",
					hostBuilding: "Building A",
					title: "Fresh Pizza",
					description: "Delicious pizza",
					foodItems: ["Pizza"],
					quantity: 5,
					dietaryTags: [],
					imageUrl: null,
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
						roomNumber: "Room 201B",
					},
				}),
			});

			expect(res.status).toBe(201);

			const json = await res.json();
			const listingResult = await db.query(
				"SELECT building_name, room_number, lat, lng FROM listings WHERE id = $1",
				[json.data.id],
			);
			expect(listingResult.rows[0]).toMatchObject({
				building_name: "Student Center",
				room_number: "Room 201B",
				lat: 40.7128,
				lng: -74.006,
			});
		});

		itIf(
			isDbAvailable,
			"should store dietary tags array correctly",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request("/listings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hostName: "Test Host",
						hostBuilding: "Building A",
						title: "Fresh Pizza",
						description: "Delicious pizza",
						foodItems: ["Pizza"],
						quantity: 5,
						dietaryTags: ["vegan", "gluten-free", "halal", "kosher"],
						imageUrl: null,
						location: {
							lat: 40.7128,
							lng: -74.006,
							buildingName: "Student Center",
						},
					}),
				});

				expect(res.status).toBe(201);

				const json = await res.json();
				const listingResult = await db.query(
					"SELECT dietary_tags FROM listings WHERE id = $1",
					[json.data.id],
				);
				expect(listingResult.rows[0].dietary_tags).toEqual([
					"vegan",
					"gluten-free",
					"halal",
					"kosher",
				]);
			},
		);

		itIf(isDbAvailable, "should validate required fields", async () => {
			db = getTestPoolOrThrow();
			const userId = generateTestId();

			await insertTestUsers([
				{ id: userId, name: "Test User", email: "test@example.com" },
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			// Missing hostName
			const res1 = await app.request("/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					// hostName missing
					hostBuilding: "Building A",
					title: "Fresh Pizza",
					description: "Delicious pizza",
					foodItems: ["Pizza"],
					quantity: 5,
					dietaryTags: [],
					imageUrl: null,
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
					},
				}),
			});
			expect(res1.status).toBe(400);

			// Missing title
			const res2 = await app.request("/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					hostName: "Test Host",
					hostBuilding: "Building A",
					// title missing
					description: "Delicious pizza",
					foodItems: ["Pizza"],
					quantity: 5,
					dietaryTags: [],
					imageUrl: null,
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
					},
				}),
			});
			expect(res2.status).toBe(400);

			// Missing quantity
			const res3 = await app.request("/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					hostName: "Test Host",
					hostBuilding: "Building A",
					title: "Fresh Pizza",
					description: "Delicious pizza",
					foodItems: ["Pizza"],
					// quantity missing
					dietaryTags: [],
					imageUrl: null,
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
					},
				}),
			});
			expect(res3.status).toBe(400);

			// Invalid quantity (negative)
			const res4 = await app.request("/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					hostName: "Test Host",
					hostBuilding: "Building A",
					title: "Fresh Pizza",
					description: "Delicious pizza",
					foodItems: ["Pizza"],
					quantity: -5,
					dietaryTags: [],
					imageUrl: null,
					location: {
						lat: 40.7128,
						lng: -74.006,
						buildingName: "Student Center",
					},
				}),
			});
			expect(res4.status).toBe(400);
		});

		itIf(
			isDbAvailable,
			"should require authentication (401 without session)",
			async () => {
				db = getTestPoolOrThrow();

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, async (c) => {
						return c.json({ message: "Unauthorized" }, 401);
					}),
				);

				const res = await app.request("/listings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hostName: "Test Host",
						hostBuilding: "Building A",
						title: "Fresh Pizza",
						description: "Delicious pizza",
						foodItems: ["Pizza"],
						quantity: 5,
						dietaryTags: [],
						imageUrl: null,
						location: {
							lat: 40.7128,
							lng: -74.006,
							buildingName: "Student Center",
						},
					}),
				});
				expect(res.status).toBe(401);
			},
		);
	});

	describe("PATCH /:id", () => {
		itIf(
			isDbAvailable,
			"should update listing status successfully",
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
						status: "active",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request(`/listings/${listingId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "claimed" }),
				});

				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.success).toBe(true);

				// Verify status was updated
				const listingResult = await db.query(
					"SELECT status FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].status).toBe("claimed");
			},
		);

		itIf(
			isDbAvailable,
			"should update listing quantity_remaining successfully",
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
						status: "active",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request(`/listings/${listingId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ quantityRemaining: 3 }),
				});

				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.success).toBe(true);

				// Verify quantity_remaining was updated
				const listingResult = await db.query(
					"SELECT quantity_remaining FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].quantity_remaining).toBe(3);
			},
		);

		itIf(
			isDbAvailable,
			"should handle partial update (status only)",
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
						status: "active",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request(`/listings/${listingId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "expired" }),
				});

				expect(res.status).toBe(200);

				// Verify only status was changed, quantity_remaining unchanged
				const listingResult = await db.query(
					"SELECT status, quantity_remaining FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].status).toBe("expired");
				expect(listingResult.rows[0].quantity_remaining).toBe(5); // unchanged
			},
		);

		itIf(
			isDbAvailable,
			"should handle partial update (quantityRemaining only)",
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
						status: "active",
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request(`/listings/${listingId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ quantityRemaining: 2 }),
				});

				expect(res.status).toBe(200);

				// Verify only quantity_remaining was changed, status unchanged
				const listingResult = await db.query(
					"SELECT status, quantity_remaining FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].status).toBe("active"); // unchanged
				expect(listingResult.rows[0].quantity_remaining).toBe(2);
			},
		);

		itIf(isDbAvailable, "should reject update from non-host", async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const nonHostId = generateTestId();
			const listingId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host User", email: "host@example.com" },
				{ id: nonHostId, name: "Non Host", email: "nonhost@example.com" },
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
					status: "active",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(nonHostId)),
			);

			const res = await app.request(`/listings/${listingId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "claimed" }),
			});

			expect(res.status).toBe(404);

			const json = await res.json();
			expect(json.message).toBe("Listing not found");
		});

		itIf(
			isDbAvailable,
			"should return 404 for non-existent listing",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request(`/listings/${generateTestId()}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "claimed" }),
				});

				expect(res.status).toBe(404);

				const json = await res.json();
				expect(json.message).toBe("Listing not found");
			},
		);

		itIf(isDbAvailable, "should validate UUID parameter format", async () => {
			db = getTestPoolOrThrow();
			const userId = generateTestId();

			await insertTestUsers([
				{ id: userId, name: "Test User", email: "test@example.com" },
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			const res = await app.request("/listings/invalid-uuid", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "claimed" }),
			});

			expect(res.status).toBe(400);
		});

		itIf(isDbAvailable, "should reject empty update body", async () => {
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
					status: "active",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			// Empty body - no fields provided
			const res = await app.request(`/listings/${listingId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});

			expect(res.status).toBe(400);
		});
	});

	describe("POST /:id/cancel", () => {
		itIf(isDbAvailable, "should cancel listing successfully", async () => {
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
					status: "active",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			const res = await app.request(`/listings/${listingId}/cancel`, {
				method: "POST",
			});

			expect(res.status).toBe(200);

			const json = await res.json();
			expect(json.success).toBe(true);

			// Verify status was changed to cancelled
			const listingResult = await db.query(
				"SELECT status FROM listings WHERE id = $1",
				[listingId],
			);
			expect(listingResult.rows[0].status).toBe("cancelled");
		});

		itIf(isDbAvailable, "should reject cancel from non-host", async () => {
			db = getTestPoolOrThrow();
			const hostId = generateTestId();
			const nonHostId = generateTestId();
			const listingId = generateTestId();

			await insertTestUsers([
				{ id: hostId, name: "Host User", email: "host@example.com" },
				{ id: nonHostId, name: "Non Host", email: "nonhost@example.com" },
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
					status: "active",
				},
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(nonHostId)),
			);

			const res = await app.request(`/listings/${listingId}/cancel`, {
				method: "POST",
			});

			expect(res.status).toBe(404);

			const json = await res.json();
			expect(json.message).toBe("Listing not found");
		});

		itIf(
			isDbAvailable,
			"should return 404 for non-existent listing",
			async () => {
				db = getTestPoolOrThrow();
				const userId = generateTestId();

				await insertTestUsers([
					{ id: userId, name: "Test User", email: "test@example.com" },
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				const res = await app.request(`/listings/${generateTestId()}/cancel`, {
					method: "POST",
				});

				expect(res.status).toBe(404);

				const json = await res.json();
				expect(json.message).toBe("Listing not found");
			},
		);

		itIf(
			isDbAvailable,
			"should be idempotent (cancel already cancelled listing)",
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
						status: "cancelled", // Already cancelled
					},
				]);

				const app = new Hono<AppEnv>().route(
					"/listings",
					createListingsRouter(db, createMockRequireSession(userId)),
				);

				// Cancel an already cancelled listing
				const res = await app.request(`/listings/${listingId}/cancel`, {
					method: "POST",
				});

				expect(res.status).toBe(200);

				const json = await res.json();
				expect(json.success).toBe(true);

				// Verify status is still cancelled
				const listingResult = await db.query(
					"SELECT status FROM listings WHERE id = $1",
					[listingId],
				);
				expect(listingResult.rows[0].status).toBe("cancelled");
			},
		);

		itIf(isDbAvailable, "should validate UUID parameter format", async () => {
			db = getTestPoolOrThrow();
			const userId = generateTestId();

			await insertTestUsers([
				{ id: userId, name: "Test User", email: "test@example.com" },
			]);

			const app = new Hono<AppEnv>().route(
				"/listings",
				createListingsRouter(db, createMockRequireSession(userId)),
			);

			const res = await app.request("/listings/invalid-uuid/cancel", {
				method: "POST",
			});

			expect(res.status).toBe(400);
		});
	});
});
