import { z } from "zod";

export const userRoleSchema = z.enum(["student", "organizer"]);
export const listingStatusSchema = z.enum([
	"active",
	"claimed",
	"expired",
	"cancelled",
]);
const claimStatusSchema = z.enum(["pending", "picked_up", "no_show"]);

export const impactStatsSchema = z.object({
	mealsRescued: z.number().int().nonnegative(),
	co2Saved: z.number().nonnegative(),
	pointsEarned: z.number().int().nonnegative(),
});

export const userRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	avatar_url: z.string().nullable(),
	role: userRoleSchema,
	dietary_prefs: z.array(z.string()),
	impact_stats: impactStatsSchema,
	reputation_score: z.number().int().nonnegative(),
	last_seen: z.string(),
	created_at: z.string(),
});

export const listingRowSchema = z.object({
	id: z.string().uuid(),
	host_id: z.string(),
	host_name: z.string(),
	host_building: z.string().nullable(),
	title: z.string(),
	description: z.string().nullable(),
	food_items: z.array(z.string()),
	quantity: z.number().int().positive(),
	quantity_remaining: z.number().int().nonnegative(),
	dietary_tags: z.array(z.string()),
	image_url: z.string().nullable(),
	building_name: z.string().nullable(),
	room_number: z.string().nullable(),
	lat: z.number().nullable(),
	lng: z.number().nullable(),
	expiry_minutes: z.number().int().positive(),
	expires_at: z.string(),
	posted_at: z.string(),
	status: listingStatusSchema,
});

export const claimRowSchema = z.object({
	id: z.string().uuid(),
	listing_id: z.string().uuid(),
	student_id: z.string(),
	student_name: z.string(),
	quantity: z.number().int().positive(),
	claimed_at: z
		.union([z.string(), z.date()])
		.transform((v) => (v instanceof Date ? v.toISOString() : v)),
	picked_up_at: z
		.union([z.string(), z.date()])
		.nullable()
		.transform((v) => (v instanceof Date ? v.toISOString() : v)),
	status: claimStatusSchema,
	reservation_expires_at: z
		.union([z.string(), z.date()])
		.transform((v) => (v instanceof Date ? v.toISOString() : v)),
	rating: z.number().int().min(1).max(5).nullable(),
});
