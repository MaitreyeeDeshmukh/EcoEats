// app/(auth)/auth/callback.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { authClient } from "@/services/auth-client";

export default function AuthCallbackScreen() {
	const { token, error } = useLocalSearchParams<{
		token?: string;
		error?: string;
	}>();
	const router = useRouter();
	const { refreshProfile } = useAuth();
	const toast = useToast();

	useEffect(() => {
		if (typeof error === "string" && error.length > 0) {
			let errorMessage = error;
			try {
				errorMessage = decodeURIComponent(error);
			} catch (decodeError) {
				console.warn("Failed to decode auth callback error:", decodeError);
			}
			toast.error("Sign-in failed", errorMessage);
			router.replace("/login");
			return;
		}

		if (!token || typeof token !== "string") {
			router.replace("/login");
			return;
		}

		let cancelled = false;

		authClient
			.verifyMagicLink(token)
			.then(async () => {
				if (cancelled) return;
				await refreshProfile();
				if (!cancelled) router.replace("/");
			})
			.catch((error) => {
				if (cancelled) return;
				console.warn("Auth callback error:", error);
				toast.error("Sign-in failed", "Please request a new magic link.");
				router.replace("/login");
			});

		return () => {
			cancelled = true;
		};
	}, [token, error, router, refreshProfile, toast]);

	return (
		<View className="flex-1 bg-cream items-center justify-center">
			<Spinner />
			<Text className="font-body text-gray-600 mt-4">Signing you in...</Text>
		</View>
	);
}
