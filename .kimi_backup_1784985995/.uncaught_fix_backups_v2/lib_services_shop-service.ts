/**
 * MTAA OS V10 — Canonical Shop Service
 * Merged from domains/shop/ into lib/services/shop-service.ts
 * Tables: shop_items, shop_categories, shop_orders, shop_order_items, shop_inventory
 */
import { supabase } from '@/lib/supabase/client';

export interface ShopItem {
  id: string;
  seller_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  images: string[] | null;
  status: 'active' | 'inactive' | 'out_of_stock';
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  shipping_address: any | null;
  created_at: string;
  updated_at: string;
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ── ITEMS ────────────────────────────────────────────────

export async function fetchShopItems(options: {
  categoryId?: string;
  sellerId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { categoryId, sellerId, status = 'active', search, limit = 20, offset = 0 } = options;
  let q = supabase.from('shop_items').select('*');

  if (categoryId) q = q.eq('category_id', categoryId);
  if (sellerId) q = q.eq('seller_id', sellerId);
  if (status) q = q.eq('status', status);
  if (search) q = q.ilike('name', `%${search}%`);

  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as ShopItem[];
}

export async function fetchShopItemById(id: string) {
  const { data, error } = await supabase.from('shop_items').select('*').eq('id', id).single();
  if (error) throw error;
  return data as ShopItem;
}

export async function createShopItem(payload: Partial<ShopItem>) {
  const { data, error } = await supabase.from('shop_items').insert(payload).select().single();
  if (error) throw error;
  return data as ShopItem;
}

export async function updateShopItem(id: string, payload: Partial<ShopItem>) {
  const { data, error } = await supabase.from('shop_items').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as ShopItem;
}

export async function deleteShopItem(id: string) {
  const { error } = await supabase.from('shop_items').delete().eq('id', id);
  if (error) throw error;
}

// ── ORDERS ───────────────────────────────────────────────

export async function createShopOrder(payload: {
  buyer_id: string;
  seller_id: string;
  items: { item_id: string; quantity: number; unit_price: number }[];
  shipping_address?: any;
}) {
  const total = payload.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const { data: order, error: orderErr } = await supabase
    .from('shop_orders')
    .insert({
      buyer_id: payload.buyer_id,
      seller_id: payload.seller_id,
      total_amount: total,
      currency: 'KES',
      status: 'pending',
      shipping_address: payload.shipping_address ?? null,
    })
    .select()
    .single();

  if (orderErr) throw orderErr;

  const orderItems = payload.items.map((i) => ({
    order_id: order.id,
    item_id: i.item_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    total_price: i.unit_price * i.quantity,
  }));

  const { error: itemsErr } = await supabase.from('shop_order_items').insert(orderItems);
  if (itemsErr) throw itemsErr;

  // Decrement stock
  for (const i of payload.items) {
    await supabase.rpc('decrement_shop_stock', { item_id: i.item_id, qty: i.quantity });
  }

  return order as ShopOrder;
}

export async function fetchShopOrders(userId: string, role: 'buyer' | 'seller') {
  const col = role === 'buyer' ? 'buyer_id' : 'seller_id';
  const { data, error } = await supabase
    .from('shop_orders')
    .select('*, shop_order_items(*)')
    .eq(col, userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function updateShopOrderStatus(orderId: string, status: ShopOrder['status']) {
  const { data, error } = await supabase
    .from('shop_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data as ShopOrder;
}

// ── CATEGORIES ─────────────────────────────────────────────

export async function fetchShopCategories() {
  const { data, error } = await supabase.from('shop_categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}
