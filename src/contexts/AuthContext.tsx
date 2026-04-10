// src/contexts/AuthContext.tsx
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	type User as AuthUser,
	authClient,
	type Session,
} from "@/services/auth-client";
import { createUserProfile, getUserProfile } from "@/services/users";
import type { User } from "@/types/models";

interface AuthContextValue {
	session: Session | null;
	user: AuthUser | null;
	profile: User | null;
	loading: boolean;
	signIn: (email: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [profile, setProfile] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check for stored session on mount
		authClient
			.getSession()
			.then((session) => {
				setSession(session);
			})
			.catch((error) => {
				console.error(error);
			})
			.finally(() => {
				setLoading(false);
			});

		// Subscribe to session changes
		const unsubscribe = authClient.onSessionChange((session) => {
			setSession(session);
			if (!session) {
				setProfile(null);
			}
		});

		return unsubscribe;
	}, []);

	// Fetch profile when session changes
	useEffect(() => {
		let cancelled = false;

		if (session?.user) {
			(async () => {
				try {
					let profile = await getUserProfile();
					if (cancelled) return;

					if (!profile) {
						// Create profile if it doesn't exist
						await createUserProfile({
							name: session.user.name || "EcoEats User",
							email: session.user.email,
							avatar: session.user.image,
						});
						// Fetch the newly created profile
						profile = await getUserProfile();
					}
					if (!cancelled) setProfile(profile);
				} catch (error) {
					if (!cancelled) console.error(error);
				}
			})();
		}

		return () => {
			cancelled = true;
		};
	}, [session]);

	const signIn = useCallback(async (email: string) => {
		await authClient.requestMagicLink(email);
	}, []);

	const signOut = useCallback(async () => {
		await authClient.signOut();
		setSession(null);
		setProfile(null);
	}, []);

	const refreshProfile = useCallback(async () => {
		if (session?.user) {
			const profile = await getUserProfile();
			setProfile(profile);
		}
	}, [session]);

	return (
		<AuthContext.Provider
			value={{
				session,
				user: session?.user || null,
				profile,
				loading,
				signIn,
				signOut,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
}
