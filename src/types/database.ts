import type { z } from "zod";
import type {
	claimRowSchema,
	impactStatsSchema,
	listingRowSchema,
	userRowSchema,
} from "../../shared/contracts";

export type UserRow = z.infer<typeof userRowSchema>;
export type ListingRow = z.infer<typeof listingRowSchema>;
export type ClaimRow = z.infer<typeof claimRowSchema>;
export type ImpactStats = z.infer<typeof impactStatsSchema>;

export interface Database {
	public: {
		Tables: {
			users: {
				Row: UserRow;
			};
			listings: {
				Row: ListingRow;
			};
			claims: {
				Row: ClaimRow;
			};
		};
	};
}
