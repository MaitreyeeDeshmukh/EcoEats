import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { messageResponseSchema } from "../shared/contracts";

export function validate<
	TTarget extends keyof ValidationTargets,
	TSchema extends ZodType,
>(target: TTarget, schema: TSchema) {
	return zValidator(target, schema, (result, c) => {
		if (!result.success) {
			return c.json(
				messageResponseSchema.parse({ message: "Invalid request" }),
				400,
			);
		}
	});
}
