// src/services/claims.ts

import type { InferResponseType } from "hono/client";
import { POLL_INTERVAL_CLAIMS_MS } from "@/constants/app";
import type { ClaimRow } from "@/types/database";
import type { Claim, ClaimStatus } from "@/types/models";
import { AuthError } from "@/utils/errors";
import { readRpcJson, rpcClient, rpcOptions } from "./rpc-client";

type CreateClaimResponse = InferResponseType<
	typeof rpcClient.api.claims.$post,
	201
>;
type GetListingClaimsResponse = InferResponseType<
	(typeof rpcClient.api.claims.listing)[":listingId"]["$get"],
	200
>;
type GetStudentClaimsResponse = InferResponseType<
	typeof rpcClient.api.claims.mine.$get,
	200
>;

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
	if (!studentId) {
		throw new AuthError("Please sign in to claim this listing.");
	}

	const response = await rpcClient.api.claims.$post(
		{
			json: {
				listingId,
				studentName,
				quantity,
			},
		},
		rpcOptions("Unable to create claim. Please try again."),
	);
	const payload = await readRpcJson<CreateClaimResponse>(response);
	return payload.data.id;
}

export async function confirmPickup(claimId: string): Promise<void> {
	await rpcClient.api.claims[":id"]["confirm-pickup"].$post(
		{ param: { id: claimId } },
		rpcOptions("Failed to confirm pickup"),
	);
}

export async function markNoShow(claimId: string): Promise<void> {
	await rpcClient.api.claims[":id"]["no-show"].$post(
		{ param: { id: claimId } },
		rpcOptions("Failed to mark no-show"),
	);
}

export async function submitRating(
	claimId: string,
	rating: number,
): Promise<void> {
	await rpcClient.api.claims[":id"].rating.$post(
		{
			param: { id: claimId },
			json: { rating },
		},
		rpcOptions("Failed to submit rating"),
	);
}

export function subscribeToStudentClaims(
	studentId: string,
	callback: (claims: Claim[]) => void,
): () => void {
	async function fetch() {
		try {
			if (!studentId) {
				callback([]);
				return;
			}

			const response = await rpcClient.api.claims.mine.$get(
				undefined,
				rpcOptions("Unable to fetch your claims. Please try again."),
			);
			const payload = await readRpcJson<GetStudentClaimsResponse>(response);
			callback((payload.data || []).map(normalizeClaim));
		} catch (err) {
			console.error("Failed to fetch claims:", err);
			// For subscription polling, we log errors but don't crash the app
		}
	}

	fetch();
	const timer = setInterval(fetch, POLL_INTERVAL_CLAIMS_MS);
	return () => clearInterval(timer);
}

export function subscribeToListingClaims(
	listingId: string,
	callback: (claims: Claim[]) => void,
): () => void {
	async function fetch() {
		try {
			const response = await rpcClient.api.claims.listing[":listingId"].$get(
				{ param: { listingId } },
				rpcOptions(
					"Unable to fetch claims for this listing. Please try again.",
				),
			);
			const payload = await readRpcJson<GetListingClaimsResponse>(response);
			callback((payload.data || []).map(normalizeClaim));
		} catch (err) {
			console.error("Failed to fetch listing claims:", err);
			// For subscription polling, we log errors but don't crash the app
		}
	}

	fetch();
	const timer = setInterval(fetch, POLL_INTERVAL_CLAIMS_MS);
	return () => clearInterval(timer);
}
