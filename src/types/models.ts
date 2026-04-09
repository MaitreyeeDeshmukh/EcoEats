import { ImpactStats } from "./database";

export type DietaryTag =
	| "vegetarian"
	| "vegan"
	| "halal"
	| "kosher"
	| "gluten-free";
export type ListingStatus = "active" | "claimed" | "expired" | "cancelled";
export type ClaimStatus = "pending" | "picked_up" | "no_show";
export type UserRole = "student" | "organizer";

export { ImpactStats };

export interface Location {
	lat: number;
	lng: number;
	buildingName: string;
	roomNumber?: string;
}

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

export interface Coordinates {
	lat: number;
	lng: number;
}
