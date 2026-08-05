// ============================================================
// MTAA OS V10 - Marketplace Service
// Shared marketplace tables across modules
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface MarketplaceListing {
  id: string; seller_id: string; title: string; description?: string; price: number;
  currency?: string; category?: string; condition?: string; images?: string[];
  location?: string; status: 'active' | 'sold' | 'reserved' | 'inactive'; views?: number;
  created_at?: string;
}

export interface MarketplaceCategory {
  id: string; name: string; description?: string; parent_id?: string; icon?: string;
  listing_count?: number; status?: string; created_at?: string;
}

export interface MarketplaceInquiry {
  id: string; listing_id: string; buyer_id: string; message: string; status?: string;
  created_at?: string;
}

export interface MarketplaceOffer {
  id: string; listing_id: string; buyer_id: string; offered_price: number; message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired'; created_at?: string;
}

export interface MarketplaceTransaction {
  id: string; listing_id: string; seller_id: string; buyer_id: string; final_price: number;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed'; completed_at?: string; created_at?: string;
}

export interface MarketplaceRating {
  id: string; transaction_id: string; rater_id: string; ratee_id: string; rating: number;
  comment?: string; created_at?: string;
}

export interface MarketplaceBookmark {
  id: string; user_id: string; listing_id: string; created_at?: string;
}

export interface MarketplaceSearch {
  id: string; user_id: string; query?: string; filters?: any; created_at?: string;
}

export interface MarketplaceNotification {
  id: string; user_id: string; title: string; message: string; type?: string; status?: string; created_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[MarketplaceService]', err?.message || err);
  return fallback;
}

// ─── LISTINGS ───
export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  const { data, error } = await supabase.from('marketplace_listings').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getMarketplaceListingById(id: string): Promise<MarketplaceListing | null> {
  const { data, error } = await supabase.from('marketplace_listings').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getMarketplaceListingsBySeller(sellerId: string): Promise<MarketplaceListing[]> {
  const { data, error } = await supabase.from('marketplace_listings').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getMarketplaceListingsByCategory(category: string): Promise<MarketplaceListing[]> {
  const { data, error } = await supabase.from('marketplace_listings').select('*').eq('category', category).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function searchMarketplaceListings(query: string): Promise<MarketplaceListing[]> {
  const { data, error } = await supabase.from('marketplace_listings').select('*').or(`title.ilike.%${query}%,description.ilike.%${query}%`).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function createMarketplaceListing(data: Partial<MarketplaceListing>): Promise<MarketplaceListing | null> {
  const { data: result, error } = await supabase.from('marketplace_listings').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateMarketplaceListing(id: string, data: Partial<MarketplaceListing>): Promise<MarketplaceListing | null> {
  const { data: result, error } = await supabase.from('marketplace_listings').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteMarketplaceListing(id: string): Promise<boolean> {
  const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CATEGORIES ───
export async function getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const { data, error } = await supabase.from('marketplace_categories').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getMarketplaceCategoryById(id: string): Promise<MarketplaceCategory | null> {
  const { data, error } = await supabase.from('marketplace_categories').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createMarketplaceCategory(data: Partial<MarketplaceCategory>): Promise<MarketplaceCategory | null> {
  const { data: result, error } = await supabase.from('marketplace_categories').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateMarketplaceCategory(id: string, data: Partial<MarketplaceCategory>): Promise<MarketplaceCategory | null> {
  const { data: result, error } = await supabase.from('marketplace_categories').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteMarketplaceCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('marketplace_categories').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── INQUIRIES ───
export async function getMarketplaceInquiries(listingId: string): Promise<MarketplaceInquiry[]> {
  const { data, error } = await supabase.from('marketplace_inquiries').select('*').eq('listing_id', listingId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createMarketplaceInquiry(data: Partial<MarketplaceInquiry>): Promise<MarketplaceInquiry | null> {
  const { data: result, error } = await supabase.from('marketplace_inquiries').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteMarketplaceInquiry(id: string): Promise<boolean> {
  const { error } = await supabase.from('marketplace_inquiries').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── OFFERS ───
export async function getMarketplaceOffers(listingId: string): Promise<MarketplaceOffer[]> {
  const { data, error } = await supabase.from('marketplace_offers').select('*').eq('listing_id', listingId);
  if (error) return handleError(error, []); return data || [];
}
export async function createMarketplaceOffer(data: Partial<MarketplaceOffer>): Promise<MarketplaceOffer | null> {
  const { data: result, error } = await supabase.from('marketplace_offers').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateMarketplaceOffer(id: string, data: Partial<MarketplaceOffer>): Promise<MarketplaceOffer | null> {
  const { data: result, error } = await supabase.from('marketplace_offers').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteMarketplaceOffer(id: string): Promise<boolean> {
  const { error } = await supabase.from('marketplace_offers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRANSACTIONS ───
export async function getMarketplaceTransactions(): Promise<MarketplaceTransaction[]> {
  const { data, error } = await supabase.from('marketplace_transactions').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getMarketplaceTransactionById(id: string): Promise<MarketplaceTransaction | null> {
  const { data, error } = await supabase.from('marketplace_transactions').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createMarketplaceTransaction(data: Partial<MarketplaceTransaction>): Promise<MarketplaceTransaction | null> {
  const { data: result, error } = await supabase.from('marketplace_transactions').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateMarketplaceTransaction(id: string, data: Partial<MarketplaceTransaction>): Promise<MarketplaceTransaction | null> {
  const { data: result, error } = await supabase.from('marketplace_transactions').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteMarketplaceTransaction(id: string): Promise<boolean> {
  const { error } = await supabase.from('marketplace_transactions').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── RATINGS ───
export async function getMarketplaceRatings(userId: string): Promise<MarketplaceRating[]> {
  const { data, error } = await supabase.from('marketplace_ratings').select('*').eq('ratee_id', userId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createMarketplaceRating(data: Partial<MarketplaceRating>): Promise<MarketplaceRating | null> {
  const { data: result, error } = await supabase.from('marketplace_ratings').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteMarketplaceRating(id: string): Promise<boolean> {
  const { error } = await supabase.from('marketplace_ratings').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── BOOKMARKS ───
export async function getMarketplaceBookmarks(userId: string): Promise<MarketplaceBookmark[]> {
  const { data, error } = await supabase.from('marketplace_bookmarks').select('*').eq('user_id', userId);
  if (error) return handleError(error, []); return data || [];
}
export async function createMarketplaceBookmark(data: Partial<MarketplaceBookmark>): Promise<MarketplaceBookmark | null> {
  const { data: result, error } = await supabase.from('marketplace_bookmarks').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteMarketplaceBookmark(id: string): Promise<boolean> {
  const { error } = await supabase.from('marketplace_bookmarks').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── STATS ───
export async function getMarketplaceStats(): Promise<any> {
  const { count: listings } = await supabase.from('marketplace_listings').select('*', { count: 'exact', head: true });
  const { count: transactions } = await supabase.from('marketplace_transactions').select('*', { count: 'exact', head: true });
  return { listings, transactions };
}
