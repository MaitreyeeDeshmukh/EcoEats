// src/services/listings.ts

import type { ListingRow } from "@/types/database";
import type { DietaryTag, Filters, Listing } from "@/types/models";
import { supabase } from "./supabase";

const PAGE_SIZE = 50;

function normalizeListing(row: ListingRow): Listing {
	return {
		id: row.id,
		hostId: row.host_id,
		hostName: row.host_name,
		hostBuilding: row.host_building || "",
		title: row.title,
		description: row.description || "",
		foodItems: row.food_items || [],
		quantity: row.quantity,
		quantityRemaining: row.quantity_remaining,
		dietaryTags: (row.dietary_tags || []) as DietaryTag[],
		imageUrl: row.image_url,
		location: {
			lat: row.lat || 0,
			lng: row.lng || 0,
			buildingName: row.building_name || "",
			roomNumber: row.room_number || "",
		},
		expiresAt: row.expires_at ? new Date(row.expires_at) : null,
		expiryMinutes: row.expiry_minutes,
		status: row.status,
		postedAt: new Date(row.posted_at),
	};
}

export async function fetchActiveListings(): Promise<Listing[]> {
	const { data, error } = await supabase
		.from("listings")
		.select("*")
		.eq("status", "active")
		.gt("expires_at", new Date().toISOString())
		.order("posted_at", { ascending: false })
		.limit(PAGE_SIZE);

	if (error) throw error;
	return (data || []).map(normalizeListing);
}

export function subscribeToActiveListings(
	callback: (listings: Listing[]) => void,
): () => void {
	// Initial fetch
	fetchActiveListings()
		.then(callback)
		.catch((err) => console.error("Failed to fetch listings:", err));

	// Subscribe to realtime changes
	const channel = supabase
		.channel("active-listings")
		.on(
			"postgres_changes",
			{ event: "*", schema: "public", table: "listings" },
			() => {
				fetchActiveListings()
					.then(callback)
					.catch((err) => console.error("Failed to fetch listings:", err));
			},
		)
		.subscribe();

	return () => {
		supabase.removeChannel(channel);
	};
}

export async function createListing(
	data: Omit<Listing, "id" | "postedAt" | "quantityRemaining">,
): Promise<string> {
	const expiresAt = new Date(
		Date.now() + (data.expiryMinutes || 90) * 60 * 1000,
	);

	const { data: listing, error } = await supabase
		.from("listings")
		.insert({
			host_id: data.hostId,
			host_name: data.hostName,
			host_building: data.hostBuilding,
			title: data.title,
			description: data.description,
			food_items: data.foodItems,
			quantity: data.quantity,
			quantity_remaining: data.quantity,
			dietary_tags: data.dietaryTags,
			image_url: data.imageUrl,
			building_name: data.location.buildingName,
			room_number: data.location.roomNumber,
			lat: data.location.lat,
			lng: data.location.lng,
			expiry_minutes: data.expiryMinutes || 90,
			expires_at: expiresAt.toISOString(),
			status: "active",
		})
		.select("id")
		.single();

	if (error) throw error;
	return listing.id;
}

export async function getListingById(id: string): Promise<Listing | null> {
	const { data, error } = await supabase
		.from("listings")
		.select("*")
		.eq("id", id)
		.single();

	if (error || !data) return null;
	return normalizeListing(data);
}

export async function updateListing(
	id: string,
	data: Partial<{ status: Listing["status"]; quantityRemaining: number }>,
): Promise<void> {
	const update: Record<string, unknown> = {};

	if (data.status !== undefined) {
		update.status = data.status;
	}
	if (data.quantityRemaining !== undefined) {
		update.quantity_remaining = data.quantityRemaining;
	}

	const { error } = await supabase.from("listings").update(update).eq("id", id);

	if (error) throw error;
}

export async function cancelListing(id: string): Promise<void> {
	const { error } = await supabase
		.from("listings")
		.update({ status: "cancelled" })
		.eq("id", id);

	if (error) throw error;
}

export async function expireOldListings(): Promise<void> {
	await supabase
		.from("listings")
		.update({ status: "expired" })
		.lt("expires_at", new Date().toISOString())
		.eq("status", "active");
}

export function filterListings(
	listings: Listing[],
	filters: Filters,
): Listing[] {
	return listings.filter((listing) => {
		// Dietary filter
		if (filters.dietary.length > 0) {
			const hasAllTags = filters.dietary.every((tag) =>
				listing.dietaryTags.includes(tag),
			);
			if (!hasAllTags) return false;
		}

		// Time filter
		if (listing.expiresAt) {
			const minutesRemaining = Math.floor(
				(listing.expiresAt.getTime() - Date.now()) / 60000,
			);
			if (minutesRemaining > filters.maxMinutes) return false;
		}

		return true;
	});
}
