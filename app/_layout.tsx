// app/_layout.tsx

import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import "../global.css";

function AuthGate({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();

	if (loading) {
		return null; // Show splash screen
	}

	if (!user) {
		return <Redirect href="/(auth)/login" />;
	}

	return <>{children}</>;
}

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ToastProvider>
				<AuthProvider>
					<AuthGate>
						<StatusBar style="auto" />
						<Stack screenOptions={{ headerShown: false }}>
							<Stack.Screen name="(auth)" />
							<Stack.Screen name="(tabs)" />
							<Stack.Screen name="+not-found" />
						</Stack>
					</AuthGate>
					<Toast />
				</AuthProvider>
			</ToastProvider>
		</GestureHandlerRootView>
	);
}
