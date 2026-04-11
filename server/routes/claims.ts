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
import {
	ConflictError,
	HttpError,
	NotFoundError,
	ValidationError,
} from "../errors";
import { type AppEnv, getSession } from "../session";
import { validate } from "../validation";

const RESERVATION_MINUTES = 20;

export function createClaimsRouter(
	db: Pool,
	requireSession: MiddlewareHandler<AppEnv>,
) {
	const router = new Hono<AppEnv>().use("*", requireSession);

	return router
		.get("/mine", async (c) => {
			const session = getSession(c);
			const result = await db.query(
				`
					SELECT *
					FROM claims
					WHERE student_id = $1
					ORDER BY claimed_at DESC
					LIMIT 20
				`,
				[session.user.id],
			);

			return c.json(getClaimsResponseSchema.parse({ data: result.rows }), 200);
		})
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
							error instanceof Error ? error.message : "Failed to create claim",
					}),
					statusCode,
				);
			} finally {
				client.release();
			}
		})
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

				return c.json(mutateClaimResponseSchema.parse({ success: true }), 200);
			},
		)
		.post("/:id/no-show", validate("param", claimIdParamSchema), async (c) => {
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
				return c.json(mutateClaimResponseSchema.parse({ success: true }), 200);
			} catch (error) {
				await client.query("ROLLBACK");
				const statusCode: 400 | 404 =
					error instanceof HttpError ? (error.statusCode as 400 | 404) : 400;
				return c.json(
					messageResponseSchema.parse({
						message:
							error instanceof Error ? error.message : "Failed to mark no-show",
					}),
					statusCode,
				);
			} finally {
				client.release();
			}
		})
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

				return c.json(mutateClaimResponseSchema.parse({ success: true }), 200);
			},
		);
}
