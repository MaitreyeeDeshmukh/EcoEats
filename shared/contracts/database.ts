import { z } from "zod";

/**
 * Enum schema for user roles in the system.
 * - "student": Regular user who can claim food listings
 * - "organizer": Host user who can create and manage listings
 */
export const userRoleSchema = z.enum(["student", "organizer"]);
/**
 * Enum schema for food listing statuses.
 * - "active": Listing is available for claims
 * - "claimed": All portions have been claimed
 * - "expired": Listing passed its expiration time
 * - "cancelled": Host cancelled the listing before expiration
 */
export const listingStatusSchema = z.enum([
	"active",
	"claimed",
	"expired",
	"cancelled",
]);

/**
 * Enum schema for claim statuses.
 * - "pending": Claim is active and awaiting pickup
 * - "picked_up": Food was successfully picked up by the student
 * - "no_show": Student did not show up within the reservation window
 */
const claimStatusSchema = z.enum(["pending", "picked_up", "no_show"]);

/**
 * Schema for user impact statistics tracking their contribution to food rescue.
 * Tracks meals rescued, CO2 emissions saved, and reputation points earned.
 */
export const impactStatsSchema = z.object({
	mealsRescued: z.number().int().nonnegative(),
	co2Saved: z.number().nonnegative(),
	pointsEarned: z.number().int().nonnegative(),
});

/**
 * Schema for a database row representing a user profile.
 * Contains all user information including role, preferences, and impact statistics.
 */
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

/**
 * Schema for a database row representing a food listing.
 * Contains all listing information including host details, location, quantity, and status.
 * Timestamps are normalized to ISO strings for consistent serialization.
 */
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
	expires_at: z
		.union([z.string(), z.date()])
		.transform((v) => (v instanceof Date ? v.toISOString() : v)),
	posted_at: z
		.union([z.string(), z.date()])
		.transform((v) => (v instanceof Date ? v.toISOString() : v)),
	status: listingStatusSchema,
});

/**
 * Schema for a database row representing a claim on a food listing.
 * Contains claim details including student info, quantity claimed, status, and optional rating.
 * Timestamps are normalized to ISO strings for consistent serialization.
 */
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
