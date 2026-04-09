// app/+not-found.tsx

import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
	return (
		<View className="flex-1 bg-cream items-center justify-center p-6">
			<Text className="font-display font-bold text-2xl text-gray-900 text-center">
				Page not found
			</Text>
			<Text className="font-body text-gray-600 mt-2 text-center">
				The page you're looking for doesn't exist.
			</Text>
			<Link href="/" className="mt-4 text-forest-700 font-body font-medium">
				Go back home
			</Link>
		</View>
	);
}
