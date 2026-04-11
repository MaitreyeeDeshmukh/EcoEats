import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import type { Pool } from "pg";
import {
	createListingBodySchema,
	createListingResponseSchema,
	getListingResponseSchema,
	getListingsResponseSchema,
	listingIdParamSchema,
	mutateListingResponseSchema,
	updateListingBodySchema,
} from "../../shared/contracts";
import { DEFAULT_EXPIRY_MINUTES, MAX_LISTINGS_QUERY } from "../constants";
import { ConflictError, NotFoundError } from "../errors";
import { type AppEnv, getSession } from "../session";
import { validate } from "../validation";

/**
 * Expires listings that have passed their expiration time.
 *
 * Updates the status of all active listings where expires_at is in the past
 * to 'expired'. This is typically called before fetching active listings.
 *
 * @param db - PostgreSQL connection pool for database operations
 * @returns Promise that resolves when the operation completes
 */
async function expireListings(db: Pool): Promise<void> {
	await db.query(
		`
			UPDATE listings
			SET status = 'expired'
			WHERE status = 'active'
				AND expires_at < NOW()
		`,
	);
}

/**
 * Creates and configures the listings router with all listing-related routes.
 *
 * @param db - PostgreSQL connection pool for database operations
 * @param requireSession - Middleware handler that validates user sessions
 * @returns Configured Hono router with listings routes
 */
export function createListingsRouter(
	db: Pool,
	requireSession: MiddlewareHandler<AppEnv>,
) {
	const router = new Hono<AppEnv>().use("*", requireSession);

	return (
		router
			/**
			 * GET / - Get all active listings.
			 *
			 * First expires any listings that have passed their expiration time,
			 * then returns active listings ordered by most recent first,
			 * limited to MAX_LISTINGS_QUERY.
			 */
			.get("/", async (c) => {
				await expireListings(db);

				const result = await db.query(
					`
					SELECT *
					FROM listings
					WHERE status = 'active'
						AND expires_at > NOW()
					ORDER BY posted_at DESC
					LIMIT $1
				`,
					[MAX_LISTINGS_QUERY],
				);

				return c.json(
					getListingsResponseSchema.parse({ data: result.rows }),
					200,
				);
			})
			/**
			 * GET /:id - Get a specific listing by ID.
			 *
			 * Returns the full details of a listing including all metadata.
			 *
			 * @param id - UUID of the listing to retrieve
			 * @returns The listing details
			 * @throws NotFoundError if listing doesn't exist
			 */
			.get("/:id", validate("param", listingIdParamSchema), async (c) => {
				const { id } = c.req.valid("param");
				const result = await db.query(
					`
					SELECT *
					FROM listings
					WHERE id = $1
					LIMIT 1
				`,
					[id],
				);

				if (result.rowCount === 0) {
					throw new NotFoundError("Listing not found");
				}

				return c.json(
					getListingResponseSchema.parse({ data: result.rows[0] }),
					200,
				);
			})
			/**
			 * POST / - Create a new food listing.
			 *
			 * Creates a new listing with the provided details. The listing will
			 * have an expiration time calculated from the current time plus the
			 * specified expiry minutes (defaults to DEFAULT_EXPIRY_MINUTES).
			 *
			 * @param hostName - Name of the host creating the listing
			 * @param hostBuilding - Building where the host is located
			 * @param title - Title of the listing
			 * @param description - Detailed description of the food being offered
			 * @param foodItems - Array of food item names
			 * @param quantity - Total number of portions available
			 * @param dietaryTags - Array of dietary restriction tags
			 * @param imageUrl - Optional URL to an image of the food
			 * @param location - Object containing buildingName, roomNumber, lat, lng
			 * @param expiryMinutes - Optional custom expiration time in minutes
			 * @returns Created listing with its generated ID
			 */
			.post("/", validate("json", createListingBodySchema), async (c) => {
				const session = getSession(c);
				const payload = c.req.valid("json");
				const id = crypto.randomUUID();
				const expiryMinutes = payload.expiryMinutes ?? DEFAULT_EXPIRY_MINUTES;

				await db.query(
					`
					INSERT INTO listings (
						id,
						host_id,
						host_name,
						host_building,
						title,
						description,
						food_items,
						quantity,
						quantity_remaining,
						dietary_tags,
						image_url,
						building_name,
						room_number,
						lat,
						lng,
						expiry_minutes,
						expires_at,
						status
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7,
						$8,
						$8,
						$9,
						$10,
						$11,
						$12,
						$13,
						$14,
						$15,
						NOW() + make_interval(mins => $15),
						'active'
					)
				`,
					[
						id,
						session.user.id,
						payload.hostName,
						payload.hostBuilding,
						payload.title,
						payload.description,
						payload.foodItems,
						payload.quantity,
						payload.dietaryTags,
						payload.imageUrl,
						payload.location.buildingName,
						payload.location.roomNumber ?? null,
						payload.location.lat,
						payload.location.lng,
						expiryMinutes,
					],
				);

				return c.json(createListingResponseSchema.parse({ data: { id } }), 201);
			})
			/**
			 * PATCH /:id - Update a listing's status or quantity.
			 *
			 * Allows the listing host to update the status or remaining quantity.
			 * Cannot update listings in terminal states (cancelled, expired).
			 *
			 * @param id - UUID of the listing to update
			 * @param status - Optional new status for the listing
			 * @param quantityRemaining - Optional updated quantity remaining
			 * @returns Success confirmation
			 * @throws NotFoundError if listing not found or user is not the host
			 * @throws ConflictError if listing is in a terminal state
			 */
			.patch(
				"/:id",
				validate("param", listingIdParamSchema),
				validate("json", updateListingBodySchema),
				async (c) => {
					const session = getSession(c);
					const { id } = c.req.valid("param");
					const payload = c.req.valid("json");

					// Check if listing exists and get its current state
					const listingResult = await db.query(
						`
						SELECT status, host_id
						FROM listings
						WHERE id = $1
						LIMIT 1
					`,
						[id],
					);

					if (listingResult.rowCount === 0) {
						throw new NotFoundError("Listing not found");
					}

					const listing = listingResult.rows[0] as {
						status: string;
						host_id: string;
					};

					// Verify host ownership
					if (listing.host_id !== session.user.id) {
						throw new NotFoundError("Listing not found");
					}

					// Prevent updates to listings in terminal states
					if (listing.status === "cancelled" || listing.status === "expired") {
						throw new ConflictError(
							`Cannot update listing with status '${listing.status}'`,
						);
					}

					await db.query(
						`
						UPDATE listings
						SET
							status = COALESCE($2, status),
							quantity_remaining = COALESCE($3, quantity_remaining)
						WHERE id = $1
					`,
						[id, payload.status ?? null, payload.quantityRemaining ?? null],
					);

					return c.json(
						mutateListingResponseSchema.parse({ success: true }),
						200,
					);
				},
			)
			/**
			 * POST /:id/cancel - Cancel a listing.
			 *
			 * Marks a listing as cancelled. The operation is idempotent if the
			 * listing is already cancelled. Cannot cancel expired or fully
			 * claimed listings.
			 *
			 * @param id - UUID of the listing to cancel
			 * @returns Success confirmation
			 * @throws NotFoundError if listing not found or user is not the host
			 * @throws ConflictError if listing is expired or fully claimed
			 */
			.post(
				"/:id/cancel",
				validate("param", listingIdParamSchema),
				async (c) => {
					const session = getSession(c);
					const { id } = c.req.valid("param");

					// Check if listing exists and get its current state
					const listingResult = await db.query(
						`
					SELECT status, host_id
					FROM listings
					WHERE id = $1
					LIMIT 1
				`,
						[id],
					);

					if (listingResult.rowCount === 0) {
						throw new NotFoundError("Listing not found");
					}

					const listing = listingResult.rows[0] as {
						status: string;
						host_id: string;
					};

					// Verify host ownership
					if (listing.host_id !== session.user.id) {
						throw new NotFoundError("Listing not found");
					}

					// Allow idempotent cancels (already cancelled), but reject other terminal states
					if (listing.status === "expired" || listing.status === "claimed") {
						throw new ConflictError(
							`Cannot cancel listing with status '${listing.status}'`,
						);
					}

					// Only update if not already cancelled
					if (listing.status !== "cancelled") {
						await db.query(
							`
						UPDATE listings
						SET status = 'cancelled'
						WHERE id = $1
					`,
							[id],
						);
					}

					return c.json(
						mutateListingResponseSchema.parse({ success: true }),
						200,
					);
				},
			)
	);
}
