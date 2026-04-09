// app/(tabs)/profile.tsx
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
	const { profile, signOut } = useAuth();

	return (
		<View className="flex-1 bg-cream items-center justify-center p-6">
			<Text className="font-display font-bold text-2xl text-gray-900">
				{profile?.name || "EcoEats User"}
			</Text>
			<Text className="font-body text-gray-600 mt-2">{profile?.email}</Text>
			<Button variant="outline" onPress={signOut} className="mt-8">
				Sign out
			</Button>
		</View>
	);
}
