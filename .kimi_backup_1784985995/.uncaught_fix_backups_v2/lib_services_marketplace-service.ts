/**
 * MTAA OS V10 — Marketplace Service
 * Tables: marketplace_listings, marketplace_orders, marketplace_order_items, marketplace_categories, marketplace_reviews
 */
import { supabase } from '@/lib/supabase/client';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  condition: 'new' | 'used' | 'refurbished';
  images: string[] | null;
  location: string | null;
  status: 'active' | 'sold' | 'reserved' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'disputed' | 'cancelled';
  shipping_address: any | null;
  created_at: string;
  updated_at: string;
}

// ── LISTINGS ──────────────────────────────────────────────

export async function fetchMarketplaceListings(options: {
  categoryId?: string;
  sellerId?: string;
  condition?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { categoryId, sellerId, condition, search, minPrice, maxPrice, status = 'active', limit = 20, offset = 0 } = options;
  let q = supabase.from('marketplace_listings').select('*');

  if (categoryId) q = q.eq('category_id', categoryId);
  if (sellerId) q = q.eq('seller_id', sellerId);
  if (condition) q = q.eq('condition', condition);
  if (status) q = q.eq('status', status);
  if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (minPrice !== undefined) q = q.gte('price', minPrice);
  if (maxPrice !== undefined) q = q.lte('price', maxPrice);

  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as MarketplaceListing[];
}

export async function fetchMarketplaceListingById(id: string) {
  const { data, error } = await supabase.from('marketplace_listings').select('*').eq('id', id).single();
  if (error) throw error;
  return data as MarketplaceListing;
}

export async function createMarketplaceListing(payload: Partial<MarketplaceListing>) {
  const { data, error } = await supabase.from('marketplace_listings').insert(payload).select().single();
  if (error) throw error;
  return data as MarketplaceListing;
}

export async function updateMarketplaceListing(id: string, payload: Partial<MarketplaceListing>) {
  const { data, error } = await supabase.from('marketplace_listings').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as MarketplaceListing;
}

export async function deleteMarketplaceListing(id: string) {
  const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
  if (error) throw error;
}

// ── ORDERS ────────────────────────────────────────────────

export async function createMarketplaceOrder(payload: Partial<MarketplaceOrder>) {
  const { data, error } = await supabase.from('marketplace_orders').insert(payload).select().single();
  if (error) throw error;
  return data as MarketplaceOrder;
}

export async function fetchMarketplaceOrders(userId: string, role: 'buyer' | 'seller') {
  const col = role === 'buyer' ? 'buyer_id' : 'seller_id';
  const { data, error } = await supabase
    .from('marketplace_orders')
    .select('*')
    .eq(col, userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MarketplaceOrder[];
}

export async function updateMarketplaceOrderStatus(orderId: string, status: MarketplaceOrder['status']) {
  const { data, error } = await supabase
    .from('marketplace_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data as MarketplaceOrder;
}

// ── CATEGORIES ────────────────────────────────────────────

export async function fetchMarketplaceCategories() {
  const { data, error } = await supabase.from('marketplace_categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

// ── REVIEWS ─────────────────────────────────────────────

export async function fetchMarketplaceReviews(listingId: string) {
  const { data, error } = await supabase
    .from('marketplace_reviews')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMarketplaceReview(payload: any) {
  const { data, error } = await supabase.from('marketplace_reviews').insert(payload).select().single();
  if (error) throw error;
  return data;
}
