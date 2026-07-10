import { supabase } from "@/lib/supabase";
import type {
  FreightListing, FreightBid,
  MtruckFreightAuction, MtruckFreightBid, MtruckFreightSettlement,
  MtruckMarketplaceListing, PaginatedResult
} from "@/lib/mtruck/types";

const TABLE_LISTINGS = 'mtruck_listings';
const TABLE_BIDS = 'mtruck_bids';
const TABLE_AUCTIONS = 'mtruck_freight_auctions';
const TABLE_FREIGHT_BIDS = 'mtruck_freight_bids';
const TABLE_SETTLEMENTS = 'mtruck_freight_settlements';
const TABLE_MARKETPLACE = 'mtruck_marketplace';

// ── LEGACY LISTINGS ──

export async function getListings(): Promise<FreightListing[]> {
  const { data, error } = await supabase
    .from(TABLE_LISTINGS)
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function placeBid(listingId: string, amount: number, bidderId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_BIDS)
    .insert({ listing_id: listingId, amount, bidder_id: bidderId, status: "pending" });
  if (error) throw error;
}

// ── FREIGHT AUCTIONS ──

export async function createFreightAuction(payload: {
  shipper_id: string;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  cargo_type?: string;
  weight_kg?: number;
  volume_cbm?: number;
  pickup_date?: string;
  delivery_date?: string;
  starting_bid: number;
  reserve_price?: number;
  currency?: string;
  bid_increment?: number;
}): Promise<MtruckFreightAuction> {
  const { data, error } = await supabase
    .from(TABLE_AUCTIONS)
    .insert({
      ...payload,
      currency: payload.currency ?? 'KES',
      bid_increment: payload.bid_increment ?? 100,
      auction_status: 'open'
    })
    .select()
    .single();
  if (error) throw new Error(`Create auction failed: ${error.message}`);
  return data;
}

export async function getOpenAuctions(): Promise<MtruckFreightAuction[]> {
  const { data, error } = await supabase
    .from(TABLE_AUCTIONS)
    .select('*')
    .eq('auction_status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAuctionById(auctionId: string): Promise<MtruckFreightAuction | null> {
  const { data, error } = await supabase
    .from(TABLE_AUCTIONS)
    .select(`*, ${TABLE_FREIGHT_BIDS}(*)`)
    .eq('id', auctionId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function closeAuction(auctionId: string, winningBidId?: string, winnerId?: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_AUCTIONS)
    .update({
      auction_status: winningBidId ? 'awarded' : 'closed',
      winning_bid_id: winningBidId,
      winner_id: winnerId,
      closed_at: new Date().toISOString()
    })
    .eq('id', auctionId);
  if (error) throw new Error(`Close auction failed: ${error.message}`);
}

// ── FREIGHT BIDS ──

export async function placeFreightBid(payload: {
  auction_id: string;
  bidder_id: string;
  bidder_fleet_id?: string;
  bid_amount: number;
  currency?: string;
  proposed_pickup_date?: string;
  proposed_delivery_date?: string;
  notes?: string;
}): Promise<MtruckFreightBid> {
  const { data, error } = await supabase
    .from(TABLE_FREIGHT_BIDS)
    .insert({
      ...payload,
      currency: payload.currency ?? 'KES',
      bid_status: 'pending',
      is_winning: false
    })
    .select()
    .single();
  if (error) throw new Error(`Place bid failed: ${error.message}`);
  return data;
}

export async function getMyBids(bidderId: string): Promise<MtruckFreightBid[]> {
  const { data, error } = await supabase
    .from(TABLE_FREIGHT_BIDS)
    .select(`*, ${TABLE_AUCTIONS}(*)`)
    .eq('bidder_id', bidderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function acceptBid(bidId: string): Promise<void> {
  const { error: e1 } = await supabase
    .from(TABLE_FREIGHT_BIDS)
    .update({ bid_status: 'accepted', is_winning: true })
    .eq('id', bidId);
  if (e1) throw new Error(`Accept bid failed: ${e1.message}`);
}

// ── SETTLEMENTS ──

export async function createSettlement(payload: {
  auction_id?: string;
  bid_id?: string;
  shipment_id?: string;
  shipper_id: string;
  carrier_id: string;
  agreed_amount: number;
  platform_fee?: number;
  insurance_fee?: number;
  currency?: string;
}): Promise<MtruckFreightSettlement> {
  const total = payload.agreed_amount + (payload.platform_fee ?? 0) + (payload.insurance_fee ?? 0);
  const { data, error } = await supabase
    .from(TABLE_SETTLEMENTS)
    .insert({
      ...payload,
      currency: payload.currency ?? 'KES',
      platform_fee: payload.platform_fee ?? 0,
      insurance_fee: payload.insurance_fee ?? 0,
      total_amount: total,
      payment_status: 'pending'
    })
    .select()
    .single();
  if (error) throw new Error(`Create settlement failed: ${error.message}`);
  return data;
}

export async function getSettlementsForUser(userId: string): Promise<MtruckFreightSettlement[]> {
  const { data, error } = await supabase
    .from(TABLE_SETTLEMENTS)
    .select('*')
    .or(`shipper_id.eq.${userId},carrier_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function releaseEscrow(settlementId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_SETTLEMENTS)
    .update({ payment_status: 'released', released_at: new Date().toISOString() })
    .eq('id', settlementId);
  if (error) throw new Error(`Release escrow failed: ${error.message}`);
}

// ── MARKETPLACE LISTINGS ──

export async function createMarketplaceListing(payload: {
  shipper_id: string;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  cargo_type?: string;
  weight_kg?: number;
  volume_cbm?: number;
  required_truck_type?: string;
  pickup_date?: string;
  delivery_date?: string;
  budget?: number;
  currency?: string;
  expires_at?: string;
}): Promise<MtruckMarketplaceListing> {
  const { data, error } = await supabase
    .from(TABLE_MARKETPLACE)
    .insert({
      ...payload,
      currency: payload.currency ?? 'KES',
      listing_status: 'active',
      views_count: 0,
      bids_count: 0
    })
    .select()
    .single();
  if (error) throw new Error(`Create listing failed: ${error.message}`);
  return data;
}

export async function getActiveMarketplaceListings(): Promise<MtruckMarketplaceListing[]> {
  const { data, error } = await supabase
    .from(TABLE_MARKETPLACE)
    .select('*')
    .eq('listing_status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyListings(shipperId: string): Promise<MtruckMarketplaceListing[]> {
  const { data, error } = await supabase
    .from(TABLE_MARKETPLACE)
    .select('*')
    .eq('shipper_id', shipperId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function incrementListingViews(listingId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_listing_views', { listing_id: listingId });
  if (error) throw new Error(`Increment views failed: ${error.message}`);
}
