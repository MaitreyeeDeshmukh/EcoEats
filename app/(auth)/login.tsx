// app/(auth)/login.tsx

import { useRouter } from "expo-router";
import { Leaf } from "phosphor-react-native";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { validateEmail } from "@/utils/validators";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const { signIn } = useAuth();
	const toast = useToast();
	const _router = useRouter();

	const handleSignIn = async () => {
		const emailError = validateEmail(email);
		if (emailError) {
			setError(emailError);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			await signIn(email);
			setSent(true);
			toast.success("Magic link sent!", "Check your email to sign in.");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to send magic link",
			);
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<View className="flex-1 bg-cream items-center justify-center p-6">
				<Leaf size={60} color="#1B4332" />
				<Text className="font-display font-bold text-2xl text-forest-700 mt-4 text-center">
					Check your email
				</Text>
				<Text className="font-body text-gray-600 mt-2 text-center">
					We sent a magic link to {email}
				</Text>
				<Button variant="ghost" onPress={() => setSent(false)} className="mt-4">
					Try again
				</Button>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{ flex: 1 }}
		>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
			>
				<View className="flex-1 bg-cream p-6">
					{/* Logo */}
					<View className="items-center mt-20 mb-10">
						<Leaf size={60} color="#1B4332" />
						<Text className="font-display font-bold text-3xl text-forest-700 mt-4">
							EcoEats
						</Text>
						<Text className="font-body text-gray-600 mt-2">
							Rescue food. Feed people.
						</Text>
					</View>

					{/* Form */}
					<View className="bg-white rounded-card shadow-card p-6">
						<Text className="font-display font-bold text-xl text-gray-900 mb-4">
							Sign in
						</Text>

						<Input
							label="Email"
							placeholder="your@email.com"
							value={email}
							onChangeText={setEmail}
							error={error || undefined}
							keyboardType="email-address"
							autoCapitalize="none"
							autoComplete="email"
							autoCorrect={false}
						/>

						<Button onPress={handleSignIn} loading={loading} className="mt-2">
							Send magic link
						</Button>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
