// app/(auth)/onboarding.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { updateUserProfile } from "@/services/users";

type UserRole = "student" | "organizer";

export default function OnboardingScreen() {
	const [role, setRole] = useState<UserRole>("student");
	const [loading, setLoading] = useState(false);

	const { user, refreshProfile } = useAuth();
	const router = useRouter();
	const toast = useToast();

	const handleComplete = async () => {
		if (!user) return;

		setLoading(true);
		try {
			await updateUserProfile({ role });
			await refreshProfile();
			router.replace("/(tabs)");
		} catch (error) {
			console.error("Failed to update profile:", error);
			toast.error("Failed to save role", "Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="flex-1 bg-cream p-6">
			<Text className="font-display font-bold text-2xl text-gray-900 text-center mt-10">
				How will you use EcoEats?
			</Text>

			<View className="mt-8 gap-4">
				<Pressable
					className={`
            bg-white rounded-card p-4 border-2
            ${role === "student" ? "border-forest-700" : "border-transparent"}
          `}
					onPress={() => setRole("student")}
					accessibilityRole="radio"
					accessibilityState={{ selected: role === "student" }}
				>
					<Text className="font-display font-bold text-lg text-gray-900">
						Student
					</Text>
					<Text className="font-body text-gray-600 mt-1">
						Browse listings and claim available food
					</Text>
				</Pressable>

				<Pressable
					className={`
            bg-white rounded-card p-4 border-2
            ${role === "organizer" ? "border-forest-700" : "border-transparent"}
          `}
					onPress={() => setRole("organizer")}
					accessibilityRole="radio"
					accessibilityState={{ selected: role === "organizer" }}
				>
					<Text className="font-display font-bold text-lg text-gray-900">
						Organizer
					</Text>
					<Text className="font-body text-gray-600 mt-1">
						Create listings and manage food distribution
					</Text>
				</Pressable>
			</View>

			<View className="flex-1" />

			<Button onPress={handleComplete} loading={loading} className="mb-8">
				Continue
			</Button>
		</View>
	);
}
