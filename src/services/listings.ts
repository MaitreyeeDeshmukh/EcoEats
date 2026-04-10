// src/services/listings.ts

import type { InferRequestType, InferResponseType } from "hono/client";
import type { ListingRow } from "@/types/database";
import type { DietaryTag, Filters, Listing } from "@/types/models";
import { readRpcJson, rpcClient, rpcOptions } from "./rpc-client";

const POLL_INTERVAL_MS = 20000;

type CreateListingInput = InferRequestType<
	typeof rpcClient.api.listings.$post
>["json"];
type CreateListingResponse = InferResponseType<
	typeof rpcClient.api.listings.$post,
	201
>;
type GetListingResponse = InferResponseType<
	(typeof rpcClient.api.listings)[":id"]["$get"],
	200
>;
type GetListingsResponse = InferResponseType<
	typeof rpcClient.api.listings.$get,
	200
>;
type UpdateListingInput = InferRequestType<
	(typeof rpcClient.api.listings)[":id"]["$patch"]
>["json"];

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

async function fetchActiveListings(): Promise<Listing[]> {
	const response = await rpcClient.api.listings.$get(
		undefined,
		rpcOptions("Failed to fetch listings"),
	);
	const payload = await readRpcJson<GetListingsResponse>(response);
	return (payload.data || []).map(normalizeListing);
}

export function subscribeToActiveListings(
	callback: (listings: Listing[]) => void,
): () => void {
	const sync = () => {
		fetchActiveListings()
			.then(callback)
			.catch((err) => console.error("Failed to fetch listings:", err));
	};

	sync();
	const timer = setInterval(sync, POLL_INTERVAL_MS);

	return () => clearInterval(timer);
}

export async function createListing(data: CreateListingInput): Promise<string> {
	const response = await rpcClient.api.listings.$post(
		{ json: data },
		rpcOptions("Failed to create listing"),
	);
	const payload = await readRpcJson<CreateListingResponse>(response);
	return payload.data.id;
}

export async function getListingById(id: string): Promise<Listing | null> {
	try {
		const response = await rpcClient.api.listings[":id"].$get(
			{ param: { id } },
			rpcOptions("Failed to load listing"),
		);
		const payload = await readRpcJson<GetListingResponse>(response);
		return normalizeListing(payload.data);
	} catch {
		return null;
	}
}

export async function updateListing(
	id: string,
	data: UpdateListingInput,
): Promise<void> {
	await rpcClient.api.listings[":id"].$patch(
		{
			param: { id },
			json: data,
		},
		rpcOptions("Failed to update listing"),
	);
}

export async function cancelListing(id: string): Promise<void> {
	await rpcClient.api.listings[":id"].cancel.$post(
		{ param: { id } },
		rpcOptions("Failed to cancel listing"),
	);
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
