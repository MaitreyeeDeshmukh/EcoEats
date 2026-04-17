import type { z } from "zod";
import type {
	claimStatusSchema,
	impactStatsSchema,
	listingStatusSchema,
	userRoleSchema,
} from "../../shared/contracts/database";
import type { listingLocationSchema } from "../../shared/contracts/listings";

export type DietaryTag =
	| "vegetarian"
	| "vegan"
	| "halal"
	| "kosher"
	| "gluten-free";

export type ListingStatus = z.infer<typeof listingStatusSchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ImpactStats = z.infer<typeof impactStatsSchema>;
export type Location = z.infer<typeof listingLocationSchema>;

export interface User {
	id: string;
	name: string;
	email: string;
	avatar: string | null;
	role: UserRole;
	dietaryPrefs: DietaryTag[];
	impactStats: ImpactStats;
	reputationScore: number;
	lastSeen: Date;
	createdAt: Date;
}

export interface Listing {
	id: string;
	hostId: string;
	hostName: string;
	hostBuilding: string;
	title: string;
	description: string;
	foodItems: string[];
	quantity: number;
	quantityRemaining: number;
	dietaryTags: DietaryTag[];
	imageUrl: string | null;
	location: Location;
	expiresAt: Date | null;
	expiryMinutes: number;
	status: ListingStatus;
	postedAt: Date;
}

export interface Claim {
	id: string;
	listingId: string;
	studentId: string;
	studentName: string;
	quantity: number;
	status: ClaimStatus;
	claimedAt: Date;
	pickedUpAt: Date | null;
	reservationExpiresAt: Date;
	rating: number | null;
}

export interface Filters {
	dietary: DietaryTag[];
	radiusMiles: number;
	maxMinutes: number;
}
