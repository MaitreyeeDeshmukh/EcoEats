// src/components/features/ListingCard.tsx

import { Clock, Leaf, MapPin } from "phosphor-react-native";
import { memo, useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import type { Listing } from "@/types/models";
import { getTimeRemaining } from "@/utils/foodSafety";

interface ListingCardProps {
	listing: Listing;
	onPress: () => void;
}

function ListingCardBase({ listing, onPress }: ListingCardProps) {
	// Force re-render every 60 seconds to update timer
	const [_tick, setTick] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setTick((t) => t + 1);
		}, 60000); // Update every minute

		return () => clearInterval(interval);
	}, []);

	// Memoize time calculations with tick dependency so it updates
	const remaining = useMemo(
		() => getTimeRemaining(listing.expiresAt),
		[listing.expiresAt],
	);

	const isExpiringSoon = useMemo(
		() => (remaining?.minutes ?? Infinity) < 15,
		[remaining],
	);

	// Safe access to location
	const locationName = listing.location?.buildingName ?? "Unknown location";
	const roomInfo = listing.location?.roomNumber
		? ` · Rm ${listing.location.roomNumber}`
		: "";

	return (
		<Pressable
			className="bg-white rounded-card shadow-card overflow-hidden active:opacity-80"
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${listing.title}, ${listing.quantityRemaining} portions available at ${locationName}`}
			accessibilityHint={remaining?.display || "View details"}
		>
			{/* Image section */}
			<View className="h-32 bg-forest-50">
				{listing.imageUrl ? (
					<Image
						source={{ uri: listing.imageUrl }}
						className="w-full h-full"
						resizeMode="cover"
						accessible={false}
					/>
				) : (
					<View className="flex-1 items-center justify-center">
						<Leaf size={40} color="#52B788" />
					</View>
				)}

				<View className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full">
					<Text className="text-xs font-body font-medium text-forest-700">
						{listing.quantityRemaining} left
					</Text>
				</View>
			</View>

			{/* Content */}
			<View className="p-3">
				<Text className="font-display font-bold text-base text-gray-900 mb-1">
					{listing.title}
				</Text>

				{/* Location */}
				<View className="flex-row items-center mb-2">
					<MapPin size={14} color="#6B7280" />
					<Text className="text-xs text-gray-500 font-body ml-1">
						{locationName}
						{roomInfo}
					</Text>
				</View>

				{/* Time */}
				<View className="flex-row items-center mb-2">
					<Clock size={14} color={isExpiringSoon ? "#EF4444" : "#6B7280"} />
					<Text
						className={`text-xs font-body ml-1 ${
							isExpiringSoon ? "text-red-500 font-medium" : "text-gray-500"
						}`}
					>
						{remaining?.display || "Expired"}
					</Text>
				</View>

				{/* Dietary tags */}
				{listing.dietaryTags?.length > 0 && (
					<View
						className="flex-row flex-wrap gap-1"
						accessible={true}
						accessibilityLabel={`Dietary options: ${listing.dietaryTags.join(", ")}`}
					>
						{listing.dietaryTags.slice(0, 3).map((tag) => (
							<Badge key={tag} dietary={tag}>
								{tag}
							</Badge>
						))}
					</View>
				)}
			</View>
		</Pressable>
	);
}

// Simple memo - rely on React's shallow comparison
export const ListingCard = memo(ListingCardBase);
