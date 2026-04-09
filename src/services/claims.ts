// src/services/claims.ts

import type { ClaimRow } from "@/types/database";
import type { Claim, ClaimStatus } from "@/types/models";
import { supabase } from "./supabase";

const RESERVATION_MINUTES = 20;

function normalizeClaim(row: ClaimRow): Claim {
	return {
		id: row.id,
		listingId: row.listing_id,
		studentId: row.student_id,
		studentName: row.student_name,
		quantity: row.quantity,
		status: row.status as ClaimStatus,
		claimedAt: new Date(row.claimed_at),
		pickedUpAt: row.picked_up_at ? new Date(row.picked_up_at) : null,
		reservationExpiresAt: new Date(row.reservation_expires_at),
		rating: row.rating,
	};
}

export async function createClaim(
	listingId: string,
	studentId: string,
	studentName: string,
	quantity: number = 1,
): Promise<string> {
	const reservationExpiresAt = new Date(
		Date.now() + RESERVATION_MINUTES * 60 * 1000,
	);

	// Check for existing claim
	const { data: existing } = await supabase
		.from("claims")
		.select("id")
		.eq("listing_id", listingId)
		.eq("student_id", studentId)
		.maybeSingle();

	if (existing) {
		throw new Error("Already claimed");
	}

	// Get current listing state
	const { data: listing, error: fetchError } = await supabase
		.from("listings")
		.select("quantity_remaining, status")
		.eq("id", listingId)
		.single();

	if (fetchError || !listing) {
		throw new Error("Listing not found");
	}

	if (listing.status !== "active") {
		throw new Error("Listing is no longer active");
	}

	if (listing.quantity_remaining < quantity) {
		throw new Error("Not enough portions remaining");
	}

	// Atomic update with optimistic locking
	const newQuantity = listing.quantity_remaining - quantity;
	const { error: updateError, count } = await supabase
		.from("listings")
		.update({
			quantity_remaining: newQuantity,
			status: newQuantity === 0 ? "claimed" : "active",
		})
		.eq("id", listingId)
		.eq("quantity_remaining", listing.quantity_remaining) // Optimistic lock
		.eq("status", "active");

	if (updateError || count === 0) {
		throw new Error("Listing was modified by another user. Please try again.");
	}

	// Create claim
	const { data: claim, error: claimError } = await supabase
		.from("claims")
		.insert({
			listing_id: listingId,
			student_id: studentId,
			student_name: studentName,
			quantity,
			status: "pending",
			reservation_expires_at: reservationExpiresAt.toISOString(),
		})
		.select("id")
		.single();

	if (claimError) throw claimError;

	return claim.id;
}

export async function confirmPickup(claimId: string): Promise<void> {
	const { error } = await supabase
		.from("claims")
		.update({
			status: "picked_up",
			picked_up_at: new Date().toISOString(),
		})
		.eq("id", claimId);

	if (error) throw error;
}

export async function markNoShow(claimId: string): Promise<void> {
	// Get claim details first
	const { data: claim } = await supabase
		.from("claims")
		.select("listing_id, quantity")
		.eq("id", claimId)
		.single();

	if (!claim) throw new Error("Claim not found");

	// Update claim status
	const { error } = await supabase
		.from("claims")
		.update({ status: "no_show" })
		.eq("id", claimId);

	if (error) throw error;

	// Restore listing quantity
	const { data: listing } = await supabase
		.from("listings")
		.select("quantity_remaining")
		.eq("id", claim.listing_id)
		.single();

	if (listing) {
		await supabase
			.from("listings")
			.update({
				quantity_remaining: listing.quantity_remaining + claim.quantity,
				status: "active",
			})
			.eq("id", claim.listing_id);
	}
}

export async function submitRating(
	claimId: string,
	rating: number,
): Promise<void> {
	const { error } = await supabase
		.from("claims")
		.update({ rating })
		.eq("id", claimId);

	if (error) throw error;
}

export function subscribeToStudentClaims(
	studentId: string,
	callback: (claims: Claim[]) => void,
): () => void {
	async function fetch() {
		try {
			const { data, error } = await supabase
				.from("claims")
				.select("*")
				.eq("student_id", studentId)
				.order("claimed_at", { ascending: false })
				.limit(20);

			if (error) throw error;
			callback((data || []).map(normalizeClaim));
		} catch (err) {
			console.error("Failed to fetch claims:", err);
		}
	}

	fetch();

	const channel = supabase
		.channel(`student-claims-${studentId}`)
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "claims",
				filter: `student_id=eq.${studentId}`,
			},
			fetch,
		)
		.subscribe();

	return () => supabase.removeChannel(channel);
}

export function subscribeToListingClaims(
	listingId: string,
	callback: (claims: Claim[]) => void,
): () => void {
	async function fetch() {
		try {
			const { data, error } = await supabase
				.from("claims")
				.select("*")
				.eq("listing_id", listingId)
				.order("claimed_at", { ascending: false });

			if (error) throw error;
			callback((data || []).map(normalizeClaim));
		} catch (err) {
			console.error("Failed to fetch listing claims:", err);
		}
	}

	fetch();

	const channel = supabase
		.channel(`listing-claims-${listingId}`)
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "claims",
				filter: `listing_id=eq.${listingId}`,
			},
			fetch,
		)
		.subscribe();

	return () => supabase.removeChannel(channel);
}
