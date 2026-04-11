import { z } from "zod";
import { successResponseSchema, uuidSchema } from "./common";
import { claimRowSchema } from "./database";

/**
 * Response schema for GET /claims endpoints.
 * Returns an array of claim rows for the authenticated user.
 */
export const getClaimsResponseSchema = z.object({
	data: z.array(claimRowSchema),
});

/**
 * Path parameter schema for claim operations requiring a claim ID.
 * Used in confirm-pickup, no-show, and rating endpoints.
 */
export const claimIdParamSchema = z.object({
	id: uuidSchema,
});

/**
 * Path parameter schema for fetching claims by listing ID.
 * Used by hosts to view all claims for a specific listing they created.
 */
export const listingClaimsParamSchema = z.object({
	listingId: uuidSchema,
});

/**
 * Request body schema for creating a new claim on a food listing.
 * Requires the listing ID, student name, and optionally the quantity (defaults to 1).
 */
export const createClaimBodySchema = z.object({
	listingId: uuidSchema,
	studentName: z.string().min(1),
	quantity: z.number().int().positive().optional(),
});

/**
 * Response schema for successful claim creation.
 * Returns the ID of the newly created claim.
 */
export const createClaimResponseSchema = z.object({
	data: z.object({
		id: uuidSchema,
	}),
});

/**
 * Request body schema for submitting a rating on a completed claim.
 * Rating must be an integer between 1 and 5 (inclusive).
 */
export const submitRatingBodySchema = z.object({
	rating: z.number().int().min(1).max(5),
});

/**
 * Response schema for claim mutation operations (confirm-pickup, no-show).
 * Returns a simple success indicator without additional data.
 */
export const mutateClaimResponseSchema = successResponseSchema;
