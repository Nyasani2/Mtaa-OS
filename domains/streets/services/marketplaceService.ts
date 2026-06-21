// lib/streets/services/marketplaceService.ts
// MTAA Streets — Marketplace Service (wired to streets_marketplace_items table)

import { supabase } from '@/lib/supabase';
import { StreetMarketplaceItem } from '../types';

const PAGE_SIZE = 20;

export async function fetchMarketplaceItems(
  filters?: { category?: string; condition?: string; location?: string; search?: string; minPrice?: number; maxPrice?: number },
  page: number = 0
): Promise<{ items: StreetMarketplaceItem[]; hasMore: boolean }> {
  let query = supabase
    .from('streets_marketplace_items')
    .select(`
      *,
      seller:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.condition) {
    query = query.eq('condition', filters.condition);
  }
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  const { data, error } = await query;
  if (error) throw error;

  const items: StreetMarketplaceItem[] = (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency || 'USD',
    condition: row.condition,
    media_urls: row.media_urls || [],
    category: row.category,
    location: row.location,
    status: row.status,
    view_count: row.view_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    seller: row.seller,
  }));

  return { items, hasMore: items.length === PAGE_SIZE };
}

export async function createMarketplaceItem(
  userId: string,
  item: Omit<StreetMarketplaceItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'view_count' | 'seller'>
): Promise<StreetMarketplaceItem> {
  const { data, error } = await supabase
    .from('streets_marketplace_items')
    .insert({ ...item, user_id: userId, view_count: 0 })
    .select(`
      *,
      seller:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    price: data.price,
    currency: data.currency || 'USD',
    condition: data.condition,
    media_urls: data.media_urls || [],
    category: data.category,
    location: data.location,
    status: data.status,
    view_count: data.view_count || 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
    seller: data.seller,
  };
}

export async function updateMarketplaceItemStatus(
  itemId: string,
  userId: string,
  status: 'available' | 'reserved' | 'sold'
): Promise<void> {
  const { error } = await supabase
    .from('streets_marketplace_items')
    .update({ status })
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteMarketplaceItem(itemId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_marketplace_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function incrementItemViews(itemId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_marketplace_views', { item_id: itemId });
  if (error) throw error;
}
