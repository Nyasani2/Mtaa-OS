/**
 * MTAA OS V10 — Restaurant Service
 * Tables: restaurant_orders, restaurant_order_items, restaurant_tables, restaurant_menu_items,
 *         restaurant_inventory, restaurant_staff, restaurant_categories
 */
import { supabase } from '@/lib/supabase/client';

export interface RestaurantMenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  prep_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location: string | null;
  created_at: string;
}

export interface RestaurantOrder {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  customer_id: string | null;
  type: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  total_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  status: 'pending' | 'preparing' | 'ready';
}

// ── MENU ──────────────────────────────────────────────────

export async function fetchRestaurantMenu(restaurantId: string, categoryId?: string) {
  let q = supabase.from('restaurant_menu_items').select('*').eq('restaurant_id', restaurantId);
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return (data ?? []) as RestaurantMenuItem[];
}

export async function createMenuItem(payload: Partial<RestaurantMenuItem>) {
  const { data, error } = await supabase.from('restaurant_menu_items').insert(payload).select().single();
  if (error) throw error;
  return data as RestaurantMenuItem;
}

export async function updateMenuItem(id: string, payload: Partial<RestaurantMenuItem>) {
  const { data, error } = await supabase.from('restaurant_menu_items').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as RestaurantMenuItem;
}

// ── TABLES ────────────────────────────────────────────────

export async function fetchRestaurantTables(restaurantId: string) {
  const { data, error } = await supabase.from('restaurant_tables').select('*').eq('restaurant_id', restaurantId).order('number');
  if (error) throw error;
  return (data ?? []) as RestaurantTable[];
}

export async function updateTableStatus(id: string, status: RestaurantTable['status']) {
  const { data, error } = await supabase.from('restaurant_tables').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data as RestaurantTable;
}

// ── ORDERS ────────────────────────────────────────────────

export async function createRestaurantOrder(payload: Partial<RestaurantOrder>, items: Omit<RestaurantOrderItem, 'id' | 'order_id'>[]) {
  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const { data: order, error: oErr } = await supabase
    .from('restaurant_orders')
    .insert({ ...payload, total_amount: total })
    .select()
    .single();
  if (oErr) throw oErr;

  const orderItems = items.map((i) => ({ ...i, order_id: order.id }));
  const { error: iErr } = await supabase.from('restaurant_order_items').insert(orderItems);
  if (iErr) throw iErr;

  return order as RestaurantOrder;
}

export async function fetchRestaurantOrders(restaurantId: string, status?: string) {
  let q = supabase.from('restaurant_orders').select('*, restaurant_order_items(*)').eq('restaurant_id', restaurantId);
  if (status) q = q.eq('status', status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateRestaurantOrderStatus(orderId: string, status: RestaurantOrder['status']) {
  const { data, error } = await supabase
    .from('restaurant_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data as RestaurantOrder;
}

export async function updateOrderItemStatus(itemId: string, status: RestaurantOrderItem['status']) {
  const { data, error } = await supabase
    .from('restaurant_order_items')
    .update({ status })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── INVENTORY ─────────────────────────────────────────────

export async function fetchRestaurantInventory(restaurantId: string) {
  const { data, error } = await supabase.from('restaurant_inventory').select('*').eq('restaurant_id', restaurantId).order('name');
  if (error) throw error;
  return data ?? [];
}

export async function updateInventoryStock(id: string, quantity: number) {
  const { data, error } = await supabase
    .from('restaurant_inventory')
    .update({ quantity_in_stock: quantity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── CATEGORIES ────────────────────────────────────────────

export async function fetchRestaurantCategories(restaurantId: string) {
  const { data, error } = await supabase.from('restaurant_categories').select('*').eq('restaurant_id', restaurantId).order('name');
  if (error) throw error;
  return data ?? [];
}
