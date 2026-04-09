// src/services/auth-client.ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || "http://localhost:8787";
const TOKEN_KEY = "ecoeats_session";

function getMagicLinkCallbackURL(): string {
	if (Platform.OS === "web" && typeof window !== "undefined") {
		return `${window.location.origin}/auth/callback`;
	}
	return "ecoeats://auth/callback";
}

function getMagicLinkErrorCallbackURL(): string {
	if (Platform.OS === "web" && typeof window !== "undefined") {
		return `${window.location.origin}/login`;
	}
	return "ecoeats://login";
}

async function readErrorMessage(
	response: Response,
	fallback: string,
): Promise<string> {
	try {
		const payload = await response.json();
		if (
			payload &&
			typeof payload === "object" &&
			"message" in payload &&
			typeof payload.message === "string"
		) {
			return payload.message;
		}
		if (
			payload &&
			typeof payload === "object" &&
			"error" in payload &&
			typeof payload.error === "string"
		) {
			return payload.error;
		}
	} catch (error) {
		console.warn("Failed to parse auth error response:", error);
	}
	return fallback;
}

const webStorage = {
	getItem: async (key: string): Promise<string | null> => {
		if (typeof window === "undefined") return null;
		try {
			return window.localStorage.getItem(key);
		} catch (error) {
			console.warn("Failed to read localStorage:", error);
			return null;
		}
	},
	setItem: async (key: string, value: string): Promise<void> => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(key, value);
		} catch (error) {
			console.warn("Failed to write localStorage:", error);
		}
	},
	deleteItem: async (key: string): Promise<void> => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.removeItem(key);
		} catch (error) {
			console.warn("Failed to delete localStorage:", error);
		}
	},
};

// Storage adapter: localStorage for web, SecureStore for native
const storage = {
	getItem: async (key: string): Promise<string | null> => {
		if (Platform.OS === "web") {
			return webStorage.getItem(key);
		}
		return SecureStore.getItemAsync(key);
	},
	setItem: async (key: string, value: string): Promise<void> => {
		if (Platform.OS === "web") {
			return webStorage.setItem(key, value);
		}
		return SecureStore.setItemAsync(key, value);
	},
	deleteItem: async (key: string): Promise<void> => {
		if (Platform.OS === "web") {
			return webStorage.deleteItem(key);
		}
		return SecureStore.deleteItemAsync(key);
	},
};

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	user: User;
}

export interface User {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	emailVerified: boolean;
}

class AuthClient {
	private session: Session | null = null;
	private listeners: Set<(session: Session | null) => void> = new Set();

	async getSession(): Promise<Session | null> {
		if (this.session) {
			if (this.session.expiresAt <= new Date()) {
				this.session = null;
				await storage.deleteItem(TOKEN_KEY);
				return null;
			}
			return this.session;
		}

		const stored = await storage.getItem(TOKEN_KEY);
		if (!stored) return null;

		try {
			const parsed = JSON.parse(stored);
			if (
				!parsed ||
				typeof parsed !== "object" ||
				!parsed.id ||
				!parsed.userId ||
				!parsed.expiresAt ||
				!parsed.user
			) {
				console.warn("Invalid session data structure");
				await storage.deleteItem(TOKEN_KEY);
				return null;
			}
			const session: Session = {
				...parsed,
				expiresAt: new Date(parsed.expiresAt),
			};
			if (session.expiresAt <= new Date()) {
				await storage.deleteItem(TOKEN_KEY);
				return null;
			}
			this.session = session;
			return this.session;
		} catch (error) {
			console.warn("Failed to parse session:", error);
			await storage.deleteItem(TOKEN_KEY);
			return null;
		}
	}

	async requestMagicLink(email: string): Promise<void> {
		const callbackURL = getMagicLinkCallbackURL();
		const errorCallbackURL = getMagicLinkErrorCallbackURL();
		const response = await fetch(`${AUTH_URL}/api/auth/sign-in/magic-link`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				email,
				callbackURL,
				errorCallbackURL,
			}),
		});

		if (!response.ok) {
			throw new Error(
				await readErrorMessage(response, "Failed to send magic link"),
			);
		}
	}

	async verifyMagicLink(token: string): Promise<Session> {
		const params = new URLSearchParams({ token });
		const response = await fetch(
			`${AUTH_URL}/api/auth/magic-link/verify?${params.toString()}`,
			{
				method: "GET",
				credentials: "include",
			},
		);

		if (!response.ok) {
			throw new Error(
				await readErrorMessage(response, "Failed to verify magic link"),
			);
		}

		const data = await response.json();
		const session: Session = {
			...data.session,
			expiresAt: new Date(data.session.expiresAt),
		};
		this.session = session;

		// Store session
		await storage.setItem(TOKEN_KEY, JSON.stringify(session));

		this.notifyListeners();
		return session;
	}

	async signOut(): Promise<void> {
		try {
			await fetch(`${AUTH_URL}/api/auth/sign-out`, {
				method: "POST",
				credentials: "include",
			});
		} catch (error) {
			console.warn("Sign out request failed:", error);
		}

		this.session = null;
		await storage.deleteItem(TOKEN_KEY);
		this.notifyListeners();
	}

	onSessionChange(callback: (session: Session | null) => void): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	private notifyListeners(): void {
		for (const callback of this.listeners) {
			callback(this.session);
		}
	}

	getAccessToken(): string | null {
		return this.session?.id || null;
	}
}

export const authClient = new AuthClient();
