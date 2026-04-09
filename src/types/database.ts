export interface Database {
	public: {
		Tables: {
			users: {
				Row: UserRow;
				Insert: UserInsert;
				Update: UserUpdate;
			};
			listings: {
				Row: ListingRow;
				Insert: ListingInsert;
				Update: ListingUpdate;
			};
			claims: {
				Row: ClaimRow;
				Insert: ClaimInsert;
				Update: ClaimUpdate;
			};
		};
	};
}

export interface UserRow {
	id: string;
	name: string;
	email: string;
	avatar_url: string | null;
	role: "student" | "organizer";
	dietary_prefs: string[];
	impact_stats: ImpactStats;
	reputation_score: number;
	last_seen: string;
	created_at: string;
}

export interface UserInsert {
	id: string;
	name: string;
	email: string;
	avatar_url?: string | null;
	role?: "student" | "organizer";
	dietary_prefs?: string[];
	impact_stats?: ImpactStats;
	reputation_score?: number;
}

export interface UserUpdate {
	name?: string;
	avatar_url?: string | null;
	role?: "student" | "organizer";
	dietary_prefs?: string[];
	impact_stats?: ImpactStats;
}

export interface ListingRow {
	id: string;
	host_id: string;
	host_name: string;
	host_building: string | null;
	title: string;
	description: string | null;
	food_items: string[];
	quantity: number;
	quantity_remaining: number;
	dietary_tags: string[];
	image_url: string | null;
	building_name: string | null;
	room_number: string | null;
	lat: number | null;
	lng: number | null;
	expiry_minutes: number;
	expires_at: string;
	posted_at: string;
	status: "active" | "claimed" | "expired" | "cancelled";
	claimed_by: string[];
}

export interface ListingInsert {
	host_id: string;
	host_name: string;
	host_building?: string;
	title: string;
	description?: string;
	food_items?: string[];
	quantity: number;
	dietary_tags?: string[];
	image_url?: string | null;
	building_name?: string;
	room_number?: string;
	lat?: number | null;
	lng?: number | null;
	expiry_minutes?: number;
	expires_at: string;
}

export interface ListingUpdate {
	title?: string;
	description?: string;
	quantity?: number;
	quantity_remaining?: number;
	dietary_tags?: string[];
	image_url?: string | null;
	status?: "active" | "claimed" | "expired" | "cancelled";
}

export interface ClaimRow {
	id: string;
	listing_id: string;
	student_id: string;
	student_name: string;
	quantity: number;
	claimed_at: string;
	picked_up_at: string | null;
	status: "pending" | "picked_up" | "no_show";
	reservation_expires_at: string;
	rating: number | null;
}

export interface ClaimInsert {
	listing_id: string;
	student_id: string;
	student_name: string;
	quantity: number;
	status?: "pending";
	reservation_expires_at: string;
}

export interface ClaimUpdate {
	status?: "pending" | "picked_up" | "no_show";
	picked_up_at?: string;
	rating?: number;
}

export interface ImpactStats {
	mealsRescued: number;
	co2Saved: number;
	pointsEarned: number;
}
