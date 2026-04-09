// src/services/auth-client.ts
import * as SecureStore from "expo-secure-store";

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || "http://localhost:8787";
const TOKEN_KEY = "ecoeats_session";
const REFRESH_TOKEN_KEY = "ecoeats_refresh";

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
				await SecureStore.deleteItemAsync(TOKEN_KEY);
				return null;
			}
			return this.session;
		}

		const stored = await SecureStore.getItemAsync(TOKEN_KEY);
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
				await SecureStore.deleteItemAsync(TOKEN_KEY);
				return null;
			}
			const session: Session = {
				...parsed,
				expiresAt: new Date(parsed.expiresAt),
			};
			if (session.expiresAt <= new Date()) {
				await SecureStore.deleteItemAsync(TOKEN_KEY);
				return null;
			}
			this.session = session;
			return this.session;
		} catch (error) {
			console.warn("Failed to parse session:", error);
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			return null;
		}
	}

	async requestMagicLink(email: string): Promise<void> {
		const response = await fetch(`${AUTH_URL}/api/auth/magic-link`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to send magic link");
		}
	}

	async verifyMagicLink(token: string): Promise<Session> {
		const response = await fetch(`${AUTH_URL}/api/auth/magic-link/verify`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to verify magic link");
		}

		const data = await response.json();
		const session: Session = {
			...data.session,
			expiresAt: new Date(data.session.expiresAt),
		};
		this.session = session;

		// Store securely
		await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(session));

		if (data.refreshToken) {
			await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
		}

		this.notifyListeners();
		return session;
	}

	async signOut(): Promise<void> {
		try {
			const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
			if (refreshToken) {
				await fetch(`${AUTH_URL}/api/auth/signout`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refreshToken }),
				});
			}
		} catch (error) {
			console.warn("Sign out request failed:", error);
		}

		this.session = null;
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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
