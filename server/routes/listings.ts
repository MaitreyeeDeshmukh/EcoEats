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
import { ConflictError, NotFoundError } from "../errors";
import { type AppEnv, getSession } from "../session";
import { validate } from "../validation";

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

export function createListingsRouter(
	db: Pool,
	requireSession: MiddlewareHandler<AppEnv>,
) {
	const router = new Hono<AppEnv>().use("*", requireSession);

	return router
		.get("/", async (c) => {
			await expireListings(db);

			const result = await db.query(
				`
					SELECT *
					FROM listings
					WHERE status = 'active'
						AND expires_at > NOW()
					ORDER BY posted_at DESC
					LIMIT 50
				`,
			);

			return c.json(
				getListingsResponseSchema.parse({ data: result.rows }),
				200,
			);
		})
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
		.post("/", validate("json", createListingBodySchema), async (c) => {
			const session = getSession(c);
			const payload = c.req.valid("json");
			const id = crypto.randomUUID();
			const expiryMinutes = payload.expiryMinutes ?? 90;

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
		.post("/:id/cancel", validate("param", listingIdParamSchema), async (c) => {
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

			return c.json(mutateListingResponseSchema.parse({ success: true }), 200);
		});
}
