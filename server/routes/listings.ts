import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import type { Pool } from "pg";
import {
	createListingBodySchema,
	createListingResponseSchema,
	getListingResponseSchema,
	getListingsResponseSchema,
	listingIdParamSchema,
	messageResponseSchema,
	mutateListingResponseSchema,
	updateListingBodySchema,
} from "../../shared/contracts";
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
				return c.json(
					messageResponseSchema.parse({ message: "Listing not found" }),
					404,
				);
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
				const result = await db.query(
					`
						UPDATE listings
						SET
							status = COALESCE($3, status),
							quantity_remaining = COALESCE($4, quantity_remaining)
						WHERE id = $1
							AND host_id = $2
						RETURNING id
					`,
					[
						id,
						session.user.id,
						payload.status ?? null,
						payload.quantityRemaining ?? null,
					],
				);

				if (result.rowCount === 0) {
					return c.json(
						messageResponseSchema.parse({
							message: "Listing not found",
						}),
						404,
					);
				}

				return c.json(
					mutateListingResponseSchema.parse({ success: true }),
					200,
				);
			},
		)
		.post("/:id/cancel", validate("param", listingIdParamSchema), async (c) => {
			const session = getSession(c);
			const { id } = c.req.valid("param");
			const result = await db.query(
				`
					UPDATE listings
					SET status = 'cancelled'
					WHERE id = $1
						AND host_id = $2
					RETURNING id
				`,
				[id, session.user.id],
			);

			if (result.rowCount === 0) {
				return c.json(
					messageResponseSchema.parse({ message: "Listing not found" }),
					404,
				);
			}

			return c.json(mutateListingResponseSchema.parse({ success: true }), 200);
		});
}
