import { Hono } from "hono";
import {
	createUserProfileBodySchema,
	getUserProfileResponseSchema,
	mutateUserProfileResponseSchema,
	updateUserProfileBodySchema,
} from "../../shared/contracts";
import { pool } from "../db";
import { type AppEnv, getSession, requireSession } from "../session";
import { validate } from "../validation";

const defaultImpactStats = {
	mealsRescued: 0,
	co2Saved: 0,
	pointsEarned: 0,
};

const router = new Hono<AppEnv>().use("*", requireSession);

export const usersRouter = router
	.get("/me", async (c) => {
		const session = getSession(c);
		const result = await pool.query(
			`
			SELECT
				id,
				name,
				email,
				avatar_url,
				role,
				dietary_prefs,
				impact_stats,
				reputation_score,
				last_seen,
				created_at
			FROM users
			WHERE id = $1
		`,
			[session.user.id],
		);

		if (result.rowCount === 0) {
			return c.json(getUserProfileResponseSchema.parse({ data: null }), 200);
		}

		return c.json(
			getUserProfileResponseSchema.parse({ data: result.rows[0] }),
			200,
		);
	})
	.post("/me", validate("json", createUserProfileBodySchema), async (c) => {
		const session = getSession(c);
		const payload = c.req.valid("json");

		await pool.query(
			`
				INSERT INTO users (
					id,
					name,
					email,
					avatar_url,
					role,
					dietary_prefs,
					impact_stats,
					reputation_score
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 100)
				ON CONFLICT (id) DO NOTHING
			`,
			[
				session.user.id,
				payload.name,
				payload.email,
				payload.avatar ?? null,
				payload.role ?? "student",
				payload.dietaryPrefs ?? [],
				JSON.stringify(defaultImpactStats),
			],
		);

		return c.json(
			mutateUserProfileResponseSchema.parse({ success: true }),
			201,
		);
	})
	.patch("/me", validate("json", updateUserProfileBodySchema), async (c) => {
		const session = getSession(c);
		const payload = c.req.valid("json");

		await pool.query(
			`
				UPDATE users
				SET
					name = COALESCE($2, name),
					avatar_url = COALESCE($3, avatar_url),
					role = COALESCE($4, role),
					dietary_prefs = COALESCE($5, dietary_prefs),
					impact_stats = COALESCE($6::jsonb, impact_stats),
					last_seen = NOW()
				WHERE id = $1
			`,
			[
				session.user.id,
				payload.name ?? null,
				payload.avatar ?? null,
				payload.role ?? null,
				payload.dietaryPrefs ?? null,
				payload.impactStats ? JSON.stringify(payload.impactStats) : null,
			],
		);

		return c.json(
			mutateUserProfileResponseSchema.parse({ success: true }),
			200,
		);
	});
