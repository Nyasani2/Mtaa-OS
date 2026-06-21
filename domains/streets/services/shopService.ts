// lib/streets/services/shopService.ts
// MTAA Streets — Shop Service (wired to streets_shop_items table)

import { supabase } from '@/lib/supabase';
import { StreetShopItem } from '../types';

const PAGE_SIZE = 20;

export async function fetchShopItems(
  filters?: { category?: string; userId?: string; search?: string },
  page: number = 0
): Promise<{ items: StreetShopItem[]; hasMore: boolean }> {
  let query = supabase
    .from('streets_shop_items')
    .select(`
      *,
      seller:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const items: StreetShopItem[] = (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency || 'USD',
    media_urls: row.media_urls || [],
    category: row.category,
    stock: row.stock || 0,
    sold_count: row.sold_count || 0,
    status: row.status,
    location: row.location,
    created_at: row.created_at,
    updated_at: row.updated_at,
    seller: row.seller,
  }));

  return { items, hasMore: items.length === PAGE_SIZE };
}

export async function createShopItem(
  userId: string,
  item: Omit<StreetShopItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sold_count' | 'seller'>
): Promise<StreetShopItem> {
  const { data, error } = await supabase
    .from('streets_shop_items')
    .insert({ ...item, user_id: userId, sold_count: 0 })
    .select(`
      *,
      seller:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    description: data.description,
    price: data.price,
    currency: data.currency || 'USD',
    media_urls: data.media_urls || [],
    category: data.category,
    stock: data.stock || 0,
    sold_count: data.sold_count || 0,
    status: data.status,
    location: data.location,
    created_at: data.created_at,
    updated_at: data.updated_at,
    seller: data.seller,
  };
}

export async function updateShopItem(
  itemId: string,
  userId: string,
  updates: Partial<Omit<StreetShopItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'seller'>>
): Promise<void> {
  const { error } = await supabase
    .from('streets_shop_items')
    .update(updates)
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteShopItem(itemId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_shop_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function purchaseShopItem(
  buyerId: string,
  itemId: string,
  quantity: number = 1
): Promise<void> {
  const { error } = await supabase.rpc('process_shop_purchase', {
    p_buyer_id: buyerId,
    p_item_id: itemId,
    p_quantity: quantity,
  });
  if (error) throw error;
}
