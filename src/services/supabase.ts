// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn(
		"Supabase URL or Anon Key not configured. Authentication will not work.",
	);
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
	removeItem: async (key: string): Promise<void> => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.removeItem(key);
		} catch (error) {
			console.warn("Failed to delete localStorage:", error);
		}
	},
};

// Storage adapter: localStorage for web, SecureStore for native
const StorageAdapter = Platform.select({
	web: {
		getItem: (key: string) => webStorage.getItem(key),
		setItem: (key: string, value: string) => webStorage.setItem(key, value),
		removeItem: (key: string) => webStorage.removeItem(key),
	},
	default: {
		getItem: (key: string) => SecureStore.getItemAsync(key),
		setItem: (key: string, value: string) =>
			SecureStore.setItemAsync(key, value),
		removeItem: (key: string) => SecureStore.deleteItemAsync(key),
	},
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: StorageAdapter,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
