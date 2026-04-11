import { z } from "zod";
import { successResponseSchema, uuidSchema } from "./common";
import { listingRowSchema, listingStatusSchema } from "./database";

/**
 * Schema for the location object within a food listing.
 * Contains GPS coordinates (lat/lng) and building/room identifiers.
 */
const listingLocationSchema = z.object({
	lat: z.number(),
	lng: z.number(),
	buildingName: z.string().min(1),
	roomNumber: z.string().optional(),
});

/**
 * Response schema for GET /listings endpoint.
 * Returns an array of active listing rows.
 */
export const getListingsResponseSchema = z.object({
	data: z.array(listingRowSchema),
});

/**
 * Response schema for GET /listings/:id endpoint.
 * Returns a single complete listing row.
 */
export const getListingResponseSchema = z.object({
	data: listingRowSchema,
});

/**
 * Path parameter schema for listing operations requiring a listing ID.
 * Used in get, update, and cancel endpoints.
 */
export const listingIdParamSchema = z.object({
	id: uuidSchema,
});

/**
 * Request body schema for creating a new food listing.
 * Contains all required fields: host info, title, description, food items,
 * quantity, dietary tags, image URL, location, and optional expiry duration.
 */
export const createListingBodySchema = z.object({
	hostName: z.string().min(1),
	hostBuilding: z.string(),
	title: z.string().min(1),
	description: z.string(),
	foodItems: z.array(z.string()),
	quantity: z.number().int().positive(),
	dietaryTags: z.array(z.string()),
	imageUrl: z.string().nullable(),
	location: listingLocationSchema,
	expiryMinutes: z.number().int().positive().optional(),
});

/**
 * Response schema for successful listing creation.
 * Returns the ID of the newly created listing.
 */
export const createListingResponseSchema = z.object({
	data: z.object({
		id: uuidSchema,
	}),
});

/**
 * Request body schema for updating an existing listing.
 * Supports partial updates to status and quantityRemaining.
 * At least one field must be provided.
 */
export const updateListingBodySchema = z
	.object({
		status: listingStatusSchema.optional(),
		quantityRemaining: z.number().int().nonnegative().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

/**
 * Response schema for listing mutation operations (update, cancel).
 * Returns a simple success indicator without additional data.
 */
export const mutateListingResponseSchema = successResponseSchema;
