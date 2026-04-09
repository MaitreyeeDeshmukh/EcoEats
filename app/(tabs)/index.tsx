import { FlatList, Text, View } from "react-native";
import { ListingCard } from "@/components/features/ListingCard";
import { Spinner } from "@/components/ui/Spinner";
import {
	useFilteredListings,
	useListingsLoading,
	useListingsSubscription,
} from "@/stores/listings";

export default function FeedScreen() {
	const filteredListings = useFilteredListings();
	const loading = useListingsLoading();

	// Auto-subscribe on mount, cleanup on unmount
	useListingsSubscription();

	if (loading) {
		return <Spinner className="flex-1 bg-cream" />;
	}

	if (filteredListings.length === 0) {
		return (
			<View className="flex-1 bg-cream items-center justify-center p-6">
				<Text className="font-display font-bold text-xl text-gray-900 text-center">
					No listings available
				</Text>
				<Text className="font-body text-gray-600 mt-2 text-center">
					Check back soon for new food listings!
				</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-cream">
			<FlatList
				data={filteredListings}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<ListingCard
						listing={item}
						onPress={() => {
							// Navigate to listing detail
						}}
					/>
				)}
				contentContainerStyle={{ padding: 16, gap: 16 }}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}
