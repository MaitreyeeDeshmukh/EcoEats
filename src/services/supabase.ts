// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn(
		"Supabase URL or Anon Key not configured. Authentication will not work.",
	);
}

// Storage adapter: AsyncStorage for web, SecureStore for native
const StorageAdapter = Platform.select({
	web: {
		getItem: (key: string) => AsyncStorage.getItem(key),
		setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
		removeItem: (key: string) => AsyncStorage.removeItem(key),
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
