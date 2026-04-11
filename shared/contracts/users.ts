import { z } from "zod";
import { successResponseSchema } from "./common";
import { impactStatsSchema, userRoleSchema, userRowSchema } from "./database";

/**
 * Response schema for GET /users/profile endpoint.
 * Returns the complete user profile row or null if not found.
 */
export const getUserProfileResponseSchema = z.object({
	data: userRowSchema.nullable(),
});

/**
 * Request body schema for creating a new user profile.
 * Requires name and email; avatar, role, and dietary preferences are optional.
 */
export const createUserProfileBodySchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	avatar: z.string().nullable().optional(),
	role: userRoleSchema.optional(),
	dietaryPrefs: z.array(z.string()).optional(),
});

/**
 * Request body schema for updating an existing user profile.
 * Supports partial updates to name, avatar, role, dietary preferences, and impact stats.
 * At least one field must be provided.
 */
export const updateUserProfileBodySchema = z
	.object({
		name: z.string().min(1).optional(),
		avatar: z.string().nullable().optional(),
		role: userRoleSchema.optional(),
		dietaryPrefs: z.array(z.string()).optional(),
		impactStats: impactStatsSchema.optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

/**
 * Response schema for user profile mutation operations (create, update).
 * Returns a simple success indicator without additional data.
 */
export const mutateUserProfileResponseSchema = successResponseSchema;
