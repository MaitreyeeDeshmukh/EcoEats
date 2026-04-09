// app/(auth)/auth/callback.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { authClient } from "@/services/auth-client";

export default function AuthCallbackScreen() {
	const { token } = useLocalSearchParams<{ token?: string }>();
	const router = useRouter();
	const { refreshProfile } = useAuth();

	useEffect(() => {
		if (!token) {
			router.replace("/(auth)/login");
			return;
		}

		authClient
			.verifyMagicLink(token)
			.then(async () => {
				await refreshProfile();
				router.replace("/(tabs)");
			})
			.catch((error) => {
				console.error("Auth callback error:", error);
				router.replace("/(auth)/login");
			});
	}, [token, router.replace, refreshProfile]);

	return (
		<View className="flex-1 bg-cream items-center justify-center">
			<Spinner />
			<Text className="font-body text-gray-600 mt-4">Signing you in...</Text>
		</View>
	);
}
