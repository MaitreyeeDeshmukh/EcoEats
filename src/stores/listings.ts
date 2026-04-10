// src/stores/listings.ts

import { useEffect } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { filterListings, subscribeToActiveListings } from "@/services/listings";
import type { Filters, Listing } from "@/types/models";

interface ListingsState {
	listings: Listing[];
	filteredListings: Listing[];
	filters: Filters;
	loading: boolean;
	error: string | null;
	subscription: (() => void) | null;

	setFilters: (filters: Partial<Filters>) => void;
	clearFilters: () => void;
	setListings: (listings: Listing[]) => void;
	subscribe: () => void;
	unsubscribe: () => void;
}

const defaultFilters: Filters = {
	dietary: [],
	radiusMiles: 1,
	maxMinutes: 90,
};

const useListingsStore = create<ListingsState>()(
	subscribeWithSelector((set, get) => ({
		listings: [],
		filteredListings: [],
		filters: defaultFilters,
		loading: true,
		error: null,
		subscription: null,

		setFilters: (filters) => {
			set((state) => {
				const newFilters = { ...state.filters, ...filters };
				return {
					filters: newFilters,
					filteredListings: filterListings(state.listings, newFilters),
				};
			});
		},

		clearFilters: () => {
			set((state) => ({
				filters: defaultFilters,
				filteredListings: filterListings(state.listings, defaultFilters),
			}));
		},

		setListings: (listings) => {
			set((state) => ({
				listings,
				filteredListings: filterListings(listings, state.filters),
				loading: false,
			}));
		},

		subscribe: () => {
			const { subscription } = get();
			if (subscription) return; // Already subscribed

			const unsub = subscribeToActiveListings((listings) => {
				get().setListings(listings);
			});

			set({
				subscription: () => {
					unsub();
				},
			});
		},

		unsubscribe: () => {
			const { subscription } = get();
			if (subscription) {
				subscription();
				set({ subscription: null, listings: [], filteredListings: [] });
			}
		},
	})),
);

// Selective hooks
export function useFilteredListings() {
	return useListingsStore((s) => s.filteredListings);
}

export function useListingsLoading() {
	return useListingsStore((s) => s.loading);
}

// Auto-cleanup hook for subscription
export function useListingsSubscription() {
	useEffect(() => {
		useListingsStore.getState().subscribe();
		return () => useListingsStore.getState().unsubscribe();
	}, []);
}
