import { create } from "zustand";
import { getListings, placeBid } from "@/lib/mtruck/services/marketplace-service";
import type { FreightListing } from "@/lib/mtruck/types";

interface MarketplaceState {
  listings: FreightListing[];
  bidOnLoad: (listingId: string) => Promise<void>;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  listings: [],
  bidOnLoad: async (listingId: string) => {
    await placeBid(listingId, 0);
    const listings = await getListings();
    set({ listings });
  },
}));

(async () => { const listings = await getListings(); useMarketplaceStore.setState({ listings }); })();
