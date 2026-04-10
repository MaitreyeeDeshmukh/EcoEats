import { z } from "zod";
import { successResponseSchema } from "./common";
import { impactStatsSchema, userRoleSchema, userRowSchema } from "./database";

export const getUserProfileResponseSchema = z.object({
	data: userRowSchema.nullable(),
});

export const createUserProfileBodySchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	avatar: z.string().nullable().optional(),
	role: userRoleSchema.optional(),
	dietaryPrefs: z.array(z.string()).optional(),
});

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

export const mutateUserProfileResponseSchema = successResponseSchema;
