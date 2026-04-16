import { z } from "zod";

/**
 * Schema for success responses with a literal `true` success flag.
 * Used for mutations that complete successfully without returning data.
 */
export const successResponseSchema = z.object({
	success: z.literal(true),
});

/**
 * Schema for error responses containing a human-readable message.
 * Used when an operation fails and needs to communicate the reason to the client.
 */
export const messageResponseSchema = z.object({
	message: z.string(),
});

/**
 * Schema for UUID string validation.
 * Enforces standard UUID format (e.g., "550e8400-e29b-41d4-a716-446655440000").
 */
export const uuidSchema = z.string().uuid();

/**
 * Schema for mutation responses that return a created resource ID.
 */
export const resourceIdResponseSchema = z.object({
	data: z.object({
		id: uuidSchema,
	}),
});

/**
 * Creates an update schema that requires at least one field to be provided.
 */
export function atLeastOneFieldSchema<T extends z.ZodRawShape>(shape: T) {
	return z.object(shape).refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});
}
