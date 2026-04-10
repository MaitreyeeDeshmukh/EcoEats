import { z } from "zod";

export const successResponseSchema = z.object({
	success: z.literal(true),
});

export const messageResponseSchema = z.object({
	message: z.string(),
});

export const uuidSchema = z.string().uuid();
