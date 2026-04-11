// src/services/users.ts

import type { InferRequestType, InferResponseType } from "hono/client";
import type { UserRow } from "@/types/database";
import type { DietaryTag, ImpactStats, User, UserRole } from "@/types/models";
import { AuthError } from "@/utils/errors";
import { readRpcJson, rpcClient, rpcOptions } from "./rpc-client";

type CreateUserProfileInput = InferRequestType<
	typeof rpcClient.api.users.me.$post
>["json"];
type GetUserProfileResponse = InferResponseType<
	typeof rpcClient.api.users.me.$get,
	200
>;
type UpdateUserProfileInput = InferRequestType<
	typeof rpcClient.api.users.me.$patch
>["json"];

function normalizeUser(row: UserRow): User {
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		avatar: row.avatar_url,
		role: row.role as UserRole,
		dietaryPrefs: (row.dietary_prefs || []) as DietaryTag[],
		impactStats: row.impact_stats || {
			mealsRescued: 0,
			co2Saved: 0,
			pointsEarned: 0,
		},
		reputationScore: row.reputation_score || 100,
		lastSeen: new Date(row.last_seen),
		createdAt: new Date(row.created_at),
	};
}

export async function getUserProfile(): Promise<User | null> {
	const response = await rpcClient.api.users.me.$get(
		undefined,
		rpcOptions("Unable to load your profile. Please try again."),
	);
	const payload = await readRpcJson<GetUserProfileResponse>(response);
	return payload.data ? normalizeUser(payload.data) : null;
}

export async function updateUserProfile(
	data: UpdateUserProfileInput,
): Promise<void> {
	await rpcClient.api.users.me.$patch(
		{ json: data },
		rpcOptions("Unable to update your profile. Please try again."),
	);
}

export async function incrementUserImpactStats(
	userId: string,
	quantity: number,
): Promise<void> {
	const profile = await getUserProfile();
	if (!profile || profile.id !== userId) {
		throw new AuthError("User profile not found. Please sign in again.");
	}

	const current: ImpactStats = profile.impactStats || {
		mealsRescued: 0,
		co2Saved: 0,
		pointsEarned: 0,
	};

	const POINTS_PER_MEAL = 10;

	await rpcClient.api.users.me.$patch(
		{
			json: {
				impactStats: {
					mealsRescued: current.mealsRescued + quantity,
					co2Saved: current.co2Saved + quantity * 0.5,
					pointsEarned: current.pointsEarned + quantity * POINTS_PER_MEAL,
				},
			},
		},
		rpcOptions("Unable to update your impact stats. Please try again."),
	);
}

export async function createUserProfile(
	data: CreateUserProfileInput,
): Promise<void> {
	await rpcClient.api.users.me.$post(
		{ json: data },
		rpcOptions("Unable to create your profile. Please try again."),
	);
}
