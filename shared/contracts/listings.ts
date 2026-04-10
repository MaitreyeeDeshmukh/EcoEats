import { z } from "zod";
import { successResponseSchema, uuidSchema } from "./common";
import { listingRowSchema, listingStatusSchema } from "./database";

const listingLocationSchema = z.object({
	lat: z.number(),
	lng: z.number(),
	buildingName: z.string().min(1),
	roomNumber: z.string().optional(),
});

export const getListingsResponseSchema = z.object({
	data: z.array(listingRowSchema),
});

export const getListingResponseSchema = z.object({
	data: listingRowSchema,
});

export const listingIdParamSchema = z.object({
	id: uuidSchema,
});

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

export const createListingResponseSchema = z.object({
	data: z.object({
		id: uuidSchema,
	}),
});

export const updateListingBodySchema = z
	.object({
		status: listingStatusSchema.optional(),
		quantityRemaining: z.number().int().nonnegative().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

export const mutateListingResponseSchema = successResponseSchema;
