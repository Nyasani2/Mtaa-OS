import { create } from "zustand";
import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import {
  getListings, placeBid,
  createFreightAuction, getOpenAuctions, getAuctionById, closeAuction,
  placeFreightBid, getMyBids, acceptBid,
  createSettlement, getSettlementsForUser, releaseEscrow,
  createMarketplaceListing, getActiveMarketplaceListings, getMyListings
} from "@/lib/mtruck/services/marketplace-service";
import type { FreightListing, MtruckFreightAuction, MtruckFreightBid, MtruckFreightSettlement, MtruckMarketplaceListing } from "@/lib/mtruck/types";

interface MarketplaceState {
  listings: FreightListing[];
  auctions: MtruckFreightAuction[];
  myBids: MtruckFreightBid[];
  settlements: MtruckFreightSettlement[];
  marketplaceListings: MtruckMarketplaceListing[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshAuctions: () => Promise<void>;
  refreshMyBids: (bidderId: string) => Promise<void>;
  refreshSettlements: (userId: string) => Promise<void>;
  refreshMarketplace: () => Promise<void>;
  bidOnLoad: (listingId: string, amount: number, bidderId: string) => Promise<void>;
  createAuction: (payload: Parameters<typeof createFreightAuction>[0]) => Promise<MtruckFreightAuction>;
  placeAuctionBid: (payload: Parameters<typeof placeFreightBid>[0]) => Promise<MtruckFreightBid>;
  acceptAuctionBid: (bidId: string) => Promise<void>;
  createListing: (payload: Parameters<typeof createMarketplaceListing>[0]) => Promise<MtruckMarketplaceListing>;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  listings: [],
  auctions: [],
  myBids: [],
  settlements: [],
  marketplaceListings: [],
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const listings = await getListings();
      set({ listings, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  refreshAuctions: async () => {
    try {
      const auctions = await getOpenAuctions();
      set({ auctions });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshMyBids: async (bidderId) => {
    try {
      const bids = await getMyBids(bidderId);
      set({ myBids: bids });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshSettlements: async (userId) => {
    try {
      const settlements = await getSettlementsForUser(userId);
      set({ settlements });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshMarketplace: async () => {
    try {
      const listings = await getActiveMarketplaceListings();
      set({ marketplaceListings: listings });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  bidOnLoad: async (listingId, amount, bidderId) => {
    await placeBid(listingId, amount, bidderId);
    await get().refresh();
  },

  createAuction: async (payload) => {
    const auction = await createFreightAuction(payload);
    set((s) => ({ auctions: [auction, ...s.auctions] }));
    return auction;
  },

  placeAuctionBid: async (payload) => {
    const bid = await placeFreightBid(payload);
    set((s) => ({ myBids: [bid, ...s.myBids] }));
    return bid;
  },

  acceptAuctionBid: async (bidId) => {
    await acceptBid(bidId);
    await get().refreshAuctions();
  },

  createListing: async (payload) => {
    const listing = await createMarketplaceListing(payload);
    set((s) => ({ marketplaceListings: [listing, ...s.marketplaceListings] }));
    return listing;
  },
}));

// ── REALTIME HOOK ──
export function useMarketplaceRealtime(userId?: string) {
  const { refresh, refreshAuctions, refreshMyBids, refreshSettlements, refreshMarketplace } = useMarketplaceStore();

  useEffect(() => {
    const channels: any[] = [];

    const auctionCh = supabase
      .channel('mtruck:auctions', { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_freight_auctions' }, refreshAuctions)
      .subscribe();
    channels.push(auctionCh);

    const bidCh = supabase
      .channel(`mtruck:bids:${userId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_freight_bids', filter: `bidder_id=eq.${userId}` }, () => refreshMyBids(userId!))
      .subscribe();
    channels.push(bidCh);

    const settlementCh = supabase
      .channel(`mtruck:settlements:${userId}`, { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_freight_settlements', filter: `or(shipper_id.eq.${userId},carrier_id.eq.${userId})` }, () => refreshSettlements(userId!))
      .subscribe();
    channels.push(settlementCh);

    const mpCh = supabase
      .channel('mtruck:marketplace', { config: { private: true } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtruck_marketplace' }, refreshMarketplace)
      .subscribe();
    channels.push(mpCh);

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [userId, refresh, refreshAuctions, refreshMyBids, refreshSettlements, refreshMarketplace]);
}
