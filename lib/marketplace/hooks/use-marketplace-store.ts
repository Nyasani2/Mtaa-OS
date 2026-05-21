import { create } from "zustand";
import { getListings, getMyOrders, getTrustScore, createListing, placeOrder } from "@/lib/marketplace/services/marketplace-service";
import type { Listing, Order, TrustScore } from "@/lib/marketplace/types";

interface MarketplaceState {
  listings: Listing[];
  orders: Order[];
  trustScore: TrustScore | null;
  loading: boolean;
  refreshListings: (filter?: any) => Promise<void>;
  refreshOrders: (userId: string) => Promise<void>;
  refreshTrust: (userId: string) => Promise<void>;
  createListing: (listing: Partial<Listing>) => Promise<void>;
  placeOrder: (order: Partial<Order>) => Promise<void>;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  listings: [],
  orders: [],
  trustScore: null,
  loading: false,
  refreshListings: async (filter) => {
    set({ loading: true });
    try { const listings = await getListings(filter); set({ listings, loading: false }); }
    catch { set({ loading: false }); }
  },
  refreshOrders: async (userId) => {
    const orders = await getMyOrders(userId);
    set({ orders });
  },
  refreshTrust: async (userId) => {
    const trustScore = await getTrustScore(userId);
    set({ trustScore });
  },
  createListing: async (listing) => {
    await createListing(listing);
    const listings = await getListings();
    set({ listings });
  },
  placeOrder: async (order) => {
    await placeOrder(order);
  },
}));
