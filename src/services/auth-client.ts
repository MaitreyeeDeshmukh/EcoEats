// src/services/auth-client.ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AuthError, NetworkError } from "@/utils/errors";
import { readErrorMessage } from "./request";
import { buildServerUrl } from "./server-config";

const TOKEN_KEY = "ecoeats_session";
const AUTH_TOKEN_HEADER = "set-auth-token";

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

/**
 * Session data structure containing user authentication state.
 */
export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	user: User;
}

/**
 * User data structure representing an authenticated user.
 */
export interface User {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	emailVerified: boolean;
}

/**
 * Client-side authentication manager handling session storage,
 * magic link authentication, and token management.
 * Supports both web (localStorage) and native (SecureStore) platforms.
 */
class AuthClient {
	private session: Session | null = null;
	private authToken: string | null = null;
	private listeners: Set<(session: Session | null) => void> = new Set();

	/**
	 * Retrieves the current session, checking for stored session if not in memory.
	 * Automatically clears expired sessions.
	 * @returns The current session or null if no valid session exists
	 */
	async getSession(): Promise<Session | null> {
		if (this.session) {
			if (this.session.expiresAt <= new Date()) {
				await this.clearSession();
				return null;
			}
			return this.session;
		}

		const stored = await storage.getItem(TOKEN_KEY);
		if (!stored) return null;

		try {
			const parsed = JSON.parse(stored) as {
				session?: Session & { expiresAt: string };
				authToken?: string | null;
			};
			if (
				!parsed ||
				typeof parsed !== "object" ||
				!parsed.session ||
				!parsed.session.id ||
				!parsed.session.userId ||
				!parsed.session.expiresAt ||
				!parsed.session.user
			) {
				console.warn("Invalid session data structure");
				await storage.deleteItem(TOKEN_KEY);
				return null;
			}
			const session: Session = {
				...parsed.session,
				expiresAt: new Date(parsed.session.expiresAt),
			};
			if (session.expiresAt <= new Date()) {
				await this.clearSession();
				return null;
			}
			this.session = session;
			this.authToken = parsed.authToken ?? null;
			return this.session;
		} catch (error) {
			console.warn("Failed to parse session:", error);
			await this.clearSession();
			return null;
		}
	}

	/**
	 * Requests a magic link to be sent to the user's email for passwordless sign-in.
	 * @param email - The user's email address
	 * @throws {NetworkError} If the network connection fails
	 * @throws {AuthError} If the magic link request fails
	 */
	async requestMagicLink(email: string): Promise<void> {
		const callbackURL = getMagicLinkCallbackURL();
		const errorCallbackURL = getMagicLinkErrorCallbackURL();

		let response: Response;
		try {
			response = await fetch(buildServerUrl("/api/auth/sign-in/magic-link"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					email,
					callbackURL,
					errorCallbackURL,
				}),
			});
		} catch (_error) {
			throw new NetworkError(
				"Network connection failed. Please check your internet connection and try again.",
			);
		}

		if (!response.ok) {
			const message = await readErrorMessage(
				response,
				"Failed to send magic link. Please try again.",
			);
			throw new AuthError(message);
		}
	}

	/**
	 * Verifies a magic link token and establishes a session.
	 * @param token - The magic link token from the verification URL
	 * @returns The authenticated session
	 * @throws {NetworkError} If the network connection fails
	 * @throws {AuthError} If the token is invalid or expired
	 */
	async verifyMagicLink(token: string): Promise<Session> {
		const params = new URLSearchParams({ token });

		let response: Response;
		try {
			response = await fetch(
				buildServerUrl(`/api/auth/magic-link/verify?${params.toString()}`),
				{
					method: "GET",
					credentials: "include",
				},
			);
		} catch (_error) {
			throw new NetworkError(
				"Network connection failed. Please check your internet connection and try again.",
			);
		}

		if (!response.ok) {
			const message = await readErrorMessage(
				response,
				"Failed to verify magic link. The link may have expired or is invalid.",
			);
			throw new AuthError(message);
		}

		const data = await response.json();
		const session: Session = {
			...data.session,
			expiresAt: new Date(data.session.expiresAt),
		};
		this.session = session;
		this.authToken = response.headers.get(AUTH_TOKEN_HEADER);

		await this.persistSession();

		this.notifyListeners();
		return session;
	}

	/**
	 * Signs out the current user, clearing session data and notifying listeners.
	 * Attempts to notify the server but succeeds locally regardless of server response.
	 */
	async signOut(): Promise<void> {
		try {
			const headers = new Headers();
			if (this.authToken) {
				headers.set("Authorization", `Bearer ${this.authToken}`);
			}

			await fetch(buildServerUrl("/api/auth/sign-out"), {
				method: "POST",
				headers,
				credentials: "include",
			});
		} catch (error) {
			// Log network errors but don't block sign-out
			console.warn("Sign out request failed:", error);
		}

		await this.clearSession();
		this.notifyListeners();
	}

	/**
	 * Subscribes to session state changes.
	 * @param callback - Function called whenever the session changes
	 * @returns Unsubscribe function to stop receiving updates
	 */
	onSessionChange(callback: (session: Session | null) => void): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	private notifyListeners(): void {
		for (const callback of this.listeners) {
			callback(this.session);
		}
	}

	/**
	 * Gets the current access token for authenticated API requests.
	 * @returns The access token or null if not authenticated
	 */
	getAccessToken(): string | null {
		return this.authToken;
	}

	private async persistSession(): Promise<void> {
		if (!this.session) {
			await storage.deleteItem(TOKEN_KEY);
			return;
		}

		await storage.setItem(
			TOKEN_KEY,
			JSON.stringify({
				session: this.session,
				authToken: this.authToken,
			}),
		);
	}

	private async clearSession(): Promise<void> {
		this.session = null;
		this.authToken = null;
		await storage.deleteItem(TOKEN_KEY);
	}
}

export const authClient = new AuthClient();
