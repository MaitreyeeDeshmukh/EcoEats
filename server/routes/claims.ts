import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import type { Pool } from "pg";
import {
	claimIdParamSchema,
	createClaimBodySchema,
	createClaimResponseSchema,
	getClaimsResponseSchema,
	listingClaimsParamSchema,
	messageResponseSchema,
	mutateClaimResponseSchema,
	submitRatingBodySchema,
} from "../../shared/contracts";
import { MAX_CLAIMS_QUERY, RESERVATION_MINUTES } from "../constants";
import {
	ConflictError,
	HttpError,
	NotFoundError,
	ValidationError,
} from "../errors";
import { type AppEnv, getSession } from "../session";
import { validate } from "../validation";

/**
 * Creates and configures the claims router with all claim-related routes.
 *
 * @param db - PostgreSQL connection pool for database operations
 * @param requireSession - Middleware handler that validates user sessions
 * @returns Configured Hono router with claims routes
 */
export function createClaimsRouter(
	db: Pool,
	requireSession: MiddlewareHandler<AppEnv>,
) {
	const router = new Hono<AppEnv>().use("*", requireSession);

	return (
		router
			/**
			 * GET /mine - Get all claims for the current user.
			 *
			 * Returns a list of claims made by the authenticated student,
			 * ordered by most recent first, limited to MAX_CLAIMS_QUERY.
			 */
			.get("/mine", async (c) => {
				const session = getSession(c);
				const result = await db.query(
					`
					SELECT *
					FROM claims
					WHERE student_id = $1
					ORDER BY claimed_at DESC
					LIMIT $2
				`,
					[session.user.id, MAX_CLAIMS_QUERY],
				);

				return c.json(
					getClaimsResponseSchema.parse({ data: result.rows }),
					200,
				);
			})
			/**
			 * GET /listing/:listingId - Get claims for a specific listing.
			 *
			 * Returns all claims for a listing, but only if the requesting user
			 * is the host who created the listing.
			 *
			 * @param listingId - UUID of the listing to get claims for
			 */
			.get(
				"/listing/:listingId",
				validate("param", listingClaimsParamSchema),
				async (c) => {
					const session = getSession(c);
					const { listingId } = c.req.valid("param");
					const result = await db.query(
						`
						SELECT claims.*
						FROM claims
						INNER JOIN listings ON listings.id = claims.listing_id
						WHERE claims.listing_id = $1
							AND listings.host_id = $2
						ORDER BY claims.claimed_at DESC
					`,
						[listingId, session.user.id],
					);

					return c.json(
						getClaimsResponseSchema.parse({ data: result.rows }),
						200,
					);
				},
			)
			/**
			 * POST / - Create a new claim for a listing.
			 *
			 * Validates the user hasn't already claimed from this listing,
			 * checks availability, deducts quantity, and creates the claim
			 * with a reservation expiration time.
			 *
			 * @param listingId - UUID of the listing to claim from
			 * @param studentName - Name of the student making the claim
			 * @param quantity - Number of portions to claim (defaults to 1)
			 * @returns Created claim with ID and expiration time
			 * @throws ConflictError if user already claimed or listing is inactive
			 * @throws NotFoundError if listing doesn't exist
			 * @throws ValidationError if insufficient quantity available
			 */
			.post("/", validate("json", createClaimBodySchema), async (c) => {
				const session = getSession(c);
				const payload = c.req.valid("json");
				const quantity = payload.quantity ?? 1;
				const client = await db.connect();

				try {
					await client.query("BEGIN");

					const existingClaim = await client.query(
						`
						SELECT id
						FROM claims
						WHERE listing_id = $1
							AND student_id = $2
						LIMIT 1
					`,
						[payload.listingId, session.user.id],
					);

					if ((existingClaim.rowCount ?? 0) > 0) {
						throw new ConflictError("Already claimed");
					}

					const listingResult = await client.query(
						`
						SELECT quantity_remaining, status
						FROM listings
						WHERE id = $1
						FOR UPDATE
					`,
						[payload.listingId],
					);

					if (listingResult.rowCount === 0) {
						throw new NotFoundError("Listing not found");
					}

					const listing = listingResult.rows[0] as {
						quantity_remaining: number;
						status: string;
					};

					if (listing.status !== "active") {
						throw new ConflictError("Listing is no longer active");
					}

					if (listing.quantity_remaining < quantity) {
						throw new ValidationError("Not enough portions remaining");
					}

					const nextQuantity = listing.quantity_remaining - quantity;
					await client.query(
						`
						UPDATE listings
						SET
							quantity_remaining = $2,
							status = $3
						WHERE id = $1
					`,
						[
							payload.listingId,
							nextQuantity,
							nextQuantity === 0 ? "claimed" : "active",
						],
					);

					const claimId = crypto.randomUUID();
					await client.query(
						`
						INSERT INTO claims (
							id,
							listing_id,
							student_id,
							student_name,
							quantity,
							status,
							reservation_expires_at
						)
						VALUES (
							$1,
							$2,
							$3,
							$4,
							$5,
							'pending',
							NOW() + ($6 || ' minutes')::interval
						)
					`,
						[
							claimId,
							payload.listingId,
							session.user.id,
							payload.studentName,
							quantity,
							RESERVATION_MINUTES,
						],
					);

					await client.query("COMMIT");
					return c.json(
						createClaimResponseSchema.parse({ data: { id: claimId } }),
						201,
					);
				} catch (error) {
					await client.query("ROLLBACK");
					const statusCode: 400 | 404 | 409 =
						error instanceof HttpError
							? (error.statusCode as 400 | 404 | 409)
							: 400;
					return c.json(
						messageResponseSchema.parse({
							message:
								error instanceof Error
									? error.message
									: "Failed to create claim",
						}),
						statusCode,
					);
				} finally {
					client.release();
				}
			})
			/**
			 * POST /:id/confirm-pickup - Confirm that a claim has been picked up.
			 *
			 * Updates the claim status to 'picked_up' and records the pickup time.
			 * Only the listing host can confirm pickups for their listings.
			 *
			 * @param id - UUID of the claim to confirm
			 * @returns Success confirmation
			 * @throws NotFoundError if claim not found or user is not the host
			 */
			.post(
				"/:id/confirm-pickup",
				validate("param", claimIdParamSchema),
				async (c) => {
					const session = getSession(c);
					const { id } = c.req.valid("param");
					const result = await db.query(
						`
						UPDATE claims
						SET
							status = 'picked_up',
							picked_up_at = NOW()
						WHERE id = $1
							AND EXISTS (
								SELECT 1
								FROM listings
								WHERE listings.id = claims.listing_id
									AND listings.host_id = $2
							)
						RETURNING id
					`,
						[id, session.user.id],
					);

					if (result.rowCount === 0) {
						return c.json(
							messageResponseSchema.parse({ message: "Claim not found" }),
							404,
						);
					}

					return c.json(
						mutateClaimResponseSchema.parse({ success: true }),
						200,
					);
				},
			)
			/**
			 * POST /:id/no-show - Mark a claim as no-show.
			 *
			 * Updates the claim status to 'no_show' and returns the quantity
			 * to the listing's available inventory. Only the listing host can
			 * mark claims as no-show.
			 *
			 * @param id - UUID of the claim to mark as no-show
			 * @returns Success confirmation
			 * @throws NotFoundError if claim not found or user is not the host
			 */
			.post(
				"/:id/no-show",
				validate("param", claimIdParamSchema),
				async (c) => {
					const session = getSession(c);
					const { id } = c.req.valid("param");
					const client = await db.connect();

					try {
						await client.query("BEGIN");

						const claimResult = await client.query(
							`
						SELECT claims.listing_id, claims.quantity
						FROM claims
						INNER JOIN listings ON listings.id = claims.listing_id
						WHERE claims.id = $1
							AND listings.host_id = $2
						LIMIT 1
					`,
							[id, session.user.id],
						);

						if (claimResult.rowCount === 0) {
							throw new NotFoundError("Claim not found");
						}

						const claim = claimResult.rows[0] as {
							listing_id: string;
							quantity: number;
						};

						await client.query(
							`
						UPDATE claims
						SET status = 'no_show'
						WHERE id = $1
					`,
							[id],
						);

						await client.query(
							`
						UPDATE listings
						SET
							quantity_remaining = quantity_remaining + $2,
							status = 'active'
						WHERE id = $1
					`,
							[claim.listing_id, claim.quantity],
						);

						await client.query("COMMIT");
						return c.json(
							mutateClaimResponseSchema.parse({ success: true }),
							200,
						);
					} catch (error) {
						await client.query("ROLLBACK");
						const statusCode: 400 | 404 =
							error instanceof HttpError
								? (error.statusCode as 400 | 404)
								: 400;
						return c.json(
							messageResponseSchema.parse({
								message:
									error instanceof Error
										? error.message
										: "Failed to mark no-show",
							}),
							statusCode,
						);
					} finally {
						client.release();
					}
				},
			)
			/**
			 * POST /:id/rating - Submit a rating for a completed claim.
			 *
			 * Allows the student who made the claim to rate their experience.
			 * Rating must be between 1 and 5.
			 *
			 * @param id - UUID of the claim to rate
			 * @param rating - Rating value from 1 to 5
			 * @returns Success confirmation
			 * @throws NotFoundError if claim not found or user didn't make the claim
			 */
			.post(
				"/:id/rating",
				validate("param", claimIdParamSchema),
				validate("json", submitRatingBodySchema),
				async (c) => {
					const session = getSession(c);
					const { id } = c.req.valid("param");
					const payload = c.req.valid("json");
					const result = await db.query(
						`
						UPDATE claims
						SET rating = $2
						WHERE id = $1
							AND student_id = $3
						RETURNING id
					`,
						[id, payload.rating, session.user.id],
					);

					if (result.rowCount === 0) {
						return c.json(
							messageResponseSchema.parse({ message: "Claim not found" }),
							404,
						);
					}

					return c.json(
						mutateClaimResponseSchema.parse({ success: true }),
						200,
					);
				},
			)
	);
}
