// src/stores/cart.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Listing } from "@/types/models";

interface CartItem {
	listingId: string;
	listing: Listing;
	quantity: number;
	addedAt: Date;
}

interface CartState {
	items: CartItem[];

	addItem: (listing: Listing, quantity?: number) => void;
	removeItem: (listingId: string) => void;
	updateQuantity: (listingId: string, quantity: number) => void;
	clear: () => void;
	getTotal: () => number;
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],

			addItem: (listing, quantity = 1) => {
				set((state) => {
					const existing = state.items.find(
						(item) => item.listingId === listing.id,
					);

					if (existing) {
						return {
							items: state.items.map((item) =>
								item.listingId === listing.id
									? { ...item, quantity: item.quantity + quantity }
									: item,
							),
						};
					}

					return {
						items: [
							...state.items,
							{
								listingId: listing.id,
								listing,
								quantity,
								addedAt: new Date(),
							},
						],
					};
				});
			},

			removeItem: (listingId) => {
				set((state) => ({
					items: state.items.filter((item) => item.listingId !== listingId),
				}));
			},

			updateQuantity: (listingId, quantity) => {
				set((state) => {
					if (quantity <= 0) {
						return {
							items: state.items.filter((item) => item.listingId !== listingId),
						};
					}

					return {
						items: state.items.map((item) =>
							item.listingId === listingId ? { ...item, quantity } : item,
						),
					};
				});
			},

			clear: () => set({ items: [] }),

			getTotal: () => {
				return get().items.reduce((sum, item) => sum + item.quantity, 0);
			},
		}),
		{
			name: "ecoeats-cart",
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				if (state?.items) {
					return {
						...state,
						items: state.items.map((item) => ({
							...item,
							addedAt: new Date(item.addedAt as unknown as string),
						})),
					};
				}
				return state;
			},
		},
	),
);
