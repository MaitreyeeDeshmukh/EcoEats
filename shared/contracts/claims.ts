import { z } from "zod";
import { successResponseSchema, uuidSchema } from "./common";
import { claimRowSchema } from "./database";

export const getClaimsResponseSchema = z.object({
	data: z.array(claimRowSchema),
});

export const claimIdParamSchema = z.object({
	id: uuidSchema,
});

export const listingClaimsParamSchema = z.object({
	listingId: uuidSchema,
});

export const createClaimBodySchema = z.object({
	listingId: uuidSchema,
	studentName: z.string().min(1),
	quantity: z.number().int().positive().optional(),
});

export const createClaimResponseSchema = z.object({
	data: z.object({
		id: uuidSchema,
	}),
});

export const submitRatingBodySchema = z.object({
	rating: z.number().int().min(1).max(5),
});

export const mutateClaimResponseSchema = successResponseSchema;
