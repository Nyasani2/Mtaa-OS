// ============================================================
// MTAA OS V10 - Restaurant Service
// 18 tables: restaurant_profiles, restaurant_menus, restaurant_orders, etc.
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface RestaurantProfile {
  id: string; owner_id: string; name: string; description?: string; cuisine_type?: string;
  address?: string; phone?: string; email?: string; logo_url?: string; cover_url?: string;
  rating?: number; review_count?: number; delivery_fee?: number; min_order_amount?: number;
  opening_hours?: any; status: 'active' | 'inactive' | 'closed'; created_at?: string;
}

export interface RestaurantMenu {
  id: string; restaurant_id: string; name: string; description?: string; category?: string;
  image_url?: string; status?: string; created_at?: string;
}

export interface RestaurantMenuItem {
  id: string; menu_id: string; restaurant_id: string; name: string; description?: string;
  price: number; currency?: string; category?: string; image_url?: string; ingredients?: string[];
  allergens?: string[]; dietary_info?: string[]; prep_time?: number; status: 'available' | 'unavailable' | 'sold_out';
  created_at?: string;
}

export interface RestaurantOrder {
  id: string; restaurant_id: string; customer_id: string; items: any; subtotal: number;
  tax?: number; delivery_fee?: number; discount?: number; total_amount: number; currency?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  delivery_address?: string; delivery_instructions?: string; estimated_delivery?: string;
  payment_status?: string; created_at?: string; updated_at?: string;
}

export interface RestaurantOrderItem {
  id: string; order_id: string; menu_item_id: string; quantity: number; unit_price: number;
  total_price: number; special_instructions?: string; created_at?: string;
}

export interface RestaurantTable {
  id: string; restaurant_id: string; table_number: string; capacity: number; location?: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'; reserved_until?: string; created_at?: string;
}

export interface RestaurantReservation {
  id: string; restaurant_id: string; customer_id: string; table_id?: string; party_size: number;
  reservation_date: string; reservation_time?: string; special_requests?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'; created_at?: string;
}

export interface RestaurantReview {
  id: string; restaurant_id: string; customer_id: string; order_id?: string; rating: number;
  comment?: string; food_rating?: number; service_rating?: number; ambiance_rating?: number;
  delivery_rating?: number; images?: string[]; status?: string; created_at?: string;
}

export interface RestaurantStaff {
  id: string; restaurant_id: string; user_id: string; role: 'owner' | 'manager' | 'chef' | 'waiter' | 'delivery' | 'cashier';
  status: 'active' | 'inactive'; created_at?: string;
}

export interface RestaurantInventory {
  id: string; restaurant_id: string; item_name: string; category?: string; quantity: number;
  unit?: string; reorder_level?: number; supplier_id?: string; expiry_date?: string; status?: string; created_at?: string;
}

export interface RestaurantSupplier {
  id: string; restaurant_id: string; name: string; contact_person?: string; phone?: string;
  email?: string; address?: string; status?: string; created_at?: string;
}

export interface RestaurantPromotion {
  id: string; restaurant_id: string; name: string; description?: string; discount_type: 'percentage' | 'fixed_amount';
  discount_value: number; min_order_amount?: number; applicable_items?: string[]; start_date?: string;
  end_date?: string; status: 'active' | 'inactive' | 'expired'; created_at?: string;
}

export interface RestaurantLoyaltyProgram {
  id: string; restaurant_id: string; name: string; description?: string; points_per_currency?: number;
  reward_threshold?: number; reward_value?: number; status?: string; created_at?: string;
}

export interface RestaurantLoyaltyMember {
  id: string; program_id: string; customer_id: string; points_balance: number; total_points_earned?: number;
  total_points_redeemed?: number; tier?: string; joined_at?: string;
}

export interface RestaurantAnalytics {
  id: string; restaurant_id: string; date: string; total_orders?: number; total_revenue?: number;
  average_order_value?: number; unique_customers?: number; new_customers?: number; created_at?: string;
}

export interface RestaurantDeliveryZone {
  id: string; restaurant_id: string; name: string; boundaries?: any; delivery_fee?: number;
  min_order_amount?: number; estimated_time?: number; status?: string; created_at?: string;
}

export interface RestaurantKitchenDisplay {
  id: string; order_id: string; order_item_id: string; status: 'pending' | 'preparing' | 'ready' | 'served';
  priority?: number; notes?: string; created_at?: string; updated_at?: string;
}

export interface RestaurantPayment {
  id: string; order_id: string; amount: number; method: string; status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string; created_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[RestaurantService]', err?.message || err);
  return fallback;
}

// ─── RESTAURANT PROFILES ───
export async function getRestaurants(): Promise<RestaurantProfile[]> {
  const { data, error } = await supabase.from('restaurant_profiles').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantById(id: string): Promise<RestaurantProfile | null> {
  const { data, error } = await supabase.from('restaurant_profiles').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getRestaurantsByOwner(ownerId: string): Promise<RestaurantProfile[]> {
  const { data, error } = await supabase.from('restaurant_profiles').select('*').eq('owner_id', ownerId);
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantsByCuisine(cuisine: string): Promise<RestaurantProfile[]> {
  const { data, error } = await supabase.from('restaurant_profiles').select('*').eq('cuisine_type', cuisine).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function searchRestaurants(query: string): Promise<RestaurantProfile[]> {
  const { data, error } = await supabase.from('restaurant_profiles').select('*').or(`name.ilike.%${query}%,cuisine_type.ilike.%${query}%`).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurant(data: Partial<RestaurantProfile>): Promise<RestaurantProfile | null> {
  const { data: result, error } = await supabase.from('restaurant_profiles').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurant(id: string, data: Partial<RestaurantProfile>): Promise<RestaurantProfile | null> {
  const { data: result, error } = await supabase.from('restaurant_profiles').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurant(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_profiles').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── MENUS ───
export async function getRestaurantMenus(restaurantId: string): Promise<RestaurantMenu[]> {
  const { data, error } = await supabase.from('restaurant_menus').select('*').eq('restaurant_id', restaurantId);
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantMenuById(id: string): Promise<RestaurantMenu | null> {
  const { data, error } = await supabase.from('restaurant_menus').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantMenu(data: Partial<RestaurantMenu>): Promise<RestaurantMenu | null> {
  const { data: result, error } = await supabase.from('restaurant_menus').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantMenu(id: string, data: Partial<RestaurantMenu>): Promise<RestaurantMenu | null> {
  const { data: result, error } = await supabase.from('restaurant_menus').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantMenu(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_menus').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── MENU ITEMS ───
export async function getRestaurantMenuItems(menuId: string): Promise<RestaurantMenuItem[]> {
  const { data, error } = await supabase.from('restaurant_menu_items').select('*').eq('menu_id', menuId).eq('status', 'available');
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantMenuItemById(id: string): Promise<RestaurantMenuItem | null> {
  const { data, error } = await supabase.from('restaurant_menu_items').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getRestaurantMenuItemsByRestaurant(restaurantId: string): Promise<RestaurantMenuItem[]> {
  const { data, error } = await supabase.from('restaurant_menu_items').select('*').eq('restaurant_id', restaurantId).eq('status', 'available');
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantMenuItem(data: Partial<RestaurantMenuItem>): Promise<RestaurantMenuItem | null> {
  const { data: result, error } = await supabase.from('restaurant_menu_items').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantMenuItem(id: string, data: Partial<RestaurantMenuItem>): Promise<RestaurantMenuItem | null> {
  const { data: result, error } = await supabase.from('restaurant_menu_items').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantMenuItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_menu_items').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── ORDERS ───
export async function getRestaurantOrders(): Promise<RestaurantOrder[]> {
  const { data, error } = await supabase.from('restaurant_orders').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantOrderById(id: string): Promise<RestaurantOrder | null> {
  const { data, error } = await supabase.from('restaurant_orders').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getRestaurantOrdersByRestaurant(restaurantId: string): Promise<RestaurantOrder[]> {
  const { data, error } = await supabase.from('restaurant_orders').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantOrdersByCustomer(customerId: string): Promise<RestaurantOrder[]> {
  const { data, error } = await supabase.from('restaurant_orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantOrder(data: Partial<RestaurantOrder>): Promise<RestaurantOrder | null> {
  const { data: result, error } = await supabase.from('restaurant_orders').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantOrder(id: string, data: Partial<RestaurantOrder>): Promise<RestaurantOrder | null> {
  const { data: result, error } = await supabase.from('restaurant_orders').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantOrder(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_orders').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── ORDER ITEMS ───
export async function getRestaurantOrderItems(orderId: string): Promise<RestaurantOrderItem[]> {
  const { data, error } = await supabase.from('restaurant_order_items').select('*').eq('order_id', orderId);
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantOrderItem(data: Partial<RestaurantOrderItem>): Promise<RestaurantOrderItem | null> {
  const { data: result, error } = await supabase.from('restaurant_order_items').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantOrderItem(id: string, data: Partial<RestaurantOrderItem>): Promise<RestaurantOrderItem | null> {
  const { data: result, error } = await supabase.from('restaurant_order_items').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantOrderItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_order_items').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TABLES ───
export async function getRestaurantTables(restaurantId: string): Promise<RestaurantTable[]> {
  const { data, error } = await supabase.from('restaurant_tables').select('*').eq('restaurant_id', restaurantId).order('table_number');
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantTableById(id: string): Promise<RestaurantTable | null> {
  const { data, error } = await supabase.from('restaurant_tables').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantTable(data: Partial<RestaurantTable>): Promise<RestaurantTable | null> {
  const { data: result, error } = await supabase.from('restaurant_tables').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantTable(id: string, data: Partial<RestaurantTable>): Promise<RestaurantTable | null> {
  const { data: result, error } = await supabase.from('restaurant_tables').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantTable(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── RESERVATIONS ───
export async function getRestaurantReservations(restaurantId: string): Promise<RestaurantReservation[]> {
  const { data, error } = await supabase.from('restaurant_reservations').select('*').eq('restaurant_id', restaurantId).order('reservation_date', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantReservationById(id: string): Promise<RestaurantReservation | null> {
  const { data, error } = await supabase.from('restaurant_reservations').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function getRestaurantReservationsByCustomer(customerId: string): Promise<RestaurantReservation[]> {
  const { data, error } = await supabase.from('restaurant_reservations').select('*').eq('customer_id', customerId).order('reservation_date', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantReservation(data: Partial<RestaurantReservation>): Promise<RestaurantReservation | null> {
  const { data: result, error } = await supabase.from('restaurant_reservations').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantReservation(id: string, data: Partial<RestaurantReservation>): Promise<RestaurantReservation | null> {
  const { data: result, error } = await supabase.from('restaurant_reservations').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantReservation(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_reservations').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── REVIEWS ───
export async function getRestaurantReviews(restaurantId: string): Promise<RestaurantReview[]> {
  const { data, error } = await supabase.from('restaurant_reviews').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantReviewById(id: string): Promise<RestaurantReview | null> {
  const { data, error } = await supabase.from('restaurant_reviews').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantReview(data: Partial<RestaurantReview>): Promise<RestaurantReview | null> {
  const { data: result, error } = await supabase.from('restaurant_reviews').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantReview(id: string, data: Partial<RestaurantReview>): Promise<RestaurantReview | null> {
  const { data: result, error } = await supabase.from('restaurant_reviews').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantReview(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_reviews').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── STAFF ───
export async function getRestaurantStaff(restaurantId: string): Promise<RestaurantStaff[]> {
  const { data, error } = await supabase.from('restaurant_staff').select('*').eq('restaurant_id', restaurantId);
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantStaffById(id: string): Promise<RestaurantStaff | null> {
  const { data, error } = await supabase.from('restaurant_staff').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantStaff(data: Partial<RestaurantStaff>): Promise<RestaurantStaff | null> {
  const { data: result, error } = await supabase.from('restaurant_staff').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantStaff(id: string, data: Partial<RestaurantStaff>): Promise<RestaurantStaff | null> {
  const { data: result, error } = await supabase.from('restaurant_staff').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantStaff(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_staff').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── INVENTORY ───
export async function getRestaurantInventory(restaurantId: string): Promise<RestaurantInventory[]> {
  const { data, error } = await supabase.from('restaurant_inventory').select('*').eq('restaurant_id', restaurantId);
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantInventoryById(id: string): Promise<RestaurantInventory | null> {
  const { data, error } = await supabase.from('restaurant_inventory').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantInventory(data: Partial<RestaurantInventory>): Promise<RestaurantInventory | null> {
  const { data: result, error } = await supabase.from('restaurant_inventory').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantInventory(id: string, data: Partial<RestaurantInventory>): Promise<RestaurantInventory | null> {
  const { data: result, error } = await supabase.from('restaurant_inventory').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantInventory(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_inventory').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── SUPPLIERS ───
export async function getRestaurantSuppliers(restaurantId: string): Promise<RestaurantSupplier[]> {
  const { data, error } = await supabase.from('restaurant_suppliers').select('*').eq('restaurant_id', restaurantId);
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantSupplierById(id: string): Promise<RestaurantSupplier | null> {
  const { data, error } = await supabase.from('restaurant_suppliers').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantSupplier(data: Partial<RestaurantSupplier>): Promise<RestaurantSupplier | null> {
  const { data: result, error } = await supabase.from('restaurant_suppliers').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantSupplier(id: string, data: Partial<RestaurantSupplier>): Promise<RestaurantSupplier | null> {
  const { data: result, error } = await supabase.from('restaurant_suppliers').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantSupplier(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_suppliers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PROMOTIONS ───
export async function getRestaurantPromotions(restaurantId: string): Promise<RestaurantPromotion[]> {
  const { data, error } = await supabase.from('restaurant_promotions').select('*').eq('restaurant_id', restaurantId).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantPromotionById(id: string): Promise<RestaurantPromotion | null> {
  const { data, error } = await supabase.from('restaurant_promotions').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantPromotion(data: Partial<RestaurantPromotion>): Promise<RestaurantPromotion | null> {
  const { data: result, error } = await supabase.from('restaurant_promotions').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantPromotion(id: string, data: Partial<RestaurantPromotion>): Promise<RestaurantPromotion | null> {
  const { data: result, error } = await supabase.from('restaurant_promotions').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantPromotion(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_promotions').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── LOYALTY PROGRAMS ───
export async function getRestaurantLoyaltyPrograms(restaurantId: string): Promise<RestaurantLoyaltyProgram[]> {
  const { data, error } = await supabase.from('restaurant_loyalty_programs').select('*').eq('restaurant_id', restaurantId);
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantLoyaltyProgramById(id: string): Promise<RestaurantLoyaltyProgram | null> {
  const { data, error } = await supabase.from('restaurant_loyalty_programs').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantLoyaltyProgram(data: Partial<RestaurantLoyaltyProgram>): Promise<RestaurantLoyaltyProgram | null> {
  const { data: result, error } = await supabase.from('restaurant_loyalty_programs').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantLoyaltyProgram(id: string, data: Partial<RestaurantLoyaltyProgram>): Promise<RestaurantLoyaltyProgram | null> {
  const { data: result, error } = await supabase.from('restaurant_loyalty_programs').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantLoyaltyProgram(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_loyalty_programs').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── LOYALTY MEMBERS ───
export async function getRestaurantLoyaltyMembers(programId: string): Promise<RestaurantLoyaltyMember[]> {
  const { data, error } = await supabase.from('restaurant_loyalty_members').select('*').eq('program_id', programId);
  if (error) return handleError(error, []); return data || [];
}
export async function getRestaurantLoyaltyMemberById(id: string): Promise<RestaurantLoyaltyMember | null> {
  const { data, error } = await supabase.from('restaurant_loyalty_members').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createRestaurantLoyaltyMember(data: Partial<RestaurantLoyaltyMember>): Promise<RestaurantLoyaltyMember | null> {
  const { data: result, error } = await supabase.from('restaurant_loyalty_members').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantLoyaltyMember(id: string, data: Partial<RestaurantLoyaltyMember>): Promise<RestaurantLoyaltyMember | null> {
  const { data: result, error } = await supabase.from('restaurant_loyalty_members').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantLoyaltyMember(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_loyalty_members').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── ANALYTICS ───
export async function getRestaurantAnalytics(restaurantId: string): Promise<RestaurantAnalytics[]> {
  const { data, error } = await supabase.from('restaurant_analytics').select('*').eq('restaurant_id', restaurantId).order('date', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantAnalytics(data: Partial<RestaurantAnalytics>): Promise<RestaurantAnalytics | null> {
  const { data: result, error } = await supabase.from('restaurant_analytics').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}

// ─── DELIVERY ZONES ───
export async function getRestaurantDeliveryZones(restaurantId: string): Promise<RestaurantDeliveryZone[]> {
  const { data, error } = await supabase.from('restaurant_delivery_zones').select('*').eq('restaurant_id', restaurantId);
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantDeliveryZone(data: Partial<RestaurantDeliveryZone>): Promise<RestaurantDeliveryZone | null> {
  const { data: result, error } = await supabase.from('restaurant_delivery_zones').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantDeliveryZone(id: string, data: Partial<RestaurantDeliveryZone>): Promise<RestaurantDeliveryZone | null> {
  const { data: result, error } = await supabase.from('restaurant_delivery_zones').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantDeliveryZone(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_delivery_zones').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── KITCHEN DISPLAY ───
export async function getRestaurantKitchenDisplay(restaurantId: string): Promise<RestaurantKitchenDisplay[]> {
  const { data, error } = await supabase.from('restaurant_kitchen_display').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantKitchenDisplay(data: Partial<RestaurantKitchenDisplay>): Promise<RestaurantKitchenDisplay | null> {
  const { data: result, error } = await supabase.from('restaurant_kitchen_display').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantKitchenDisplay(id: string, data: Partial<RestaurantKitchenDisplay>): Promise<RestaurantKitchenDisplay | null> {
  const { data: result, error } = await supabase.from('restaurant_kitchen_display').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantKitchenDisplay(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_kitchen_display').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PAYMENTS ───
export async function getRestaurantPayments(restaurantId: string): Promise<RestaurantPayment[]> {
  const { data, error } = await supabase.from('restaurant_payments').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createRestaurantPayment(data: Partial<RestaurantPayment>): Promise<RestaurantPayment | null> {
  const { data: result, error } = await supabase.from('restaurant_payments').insert(data).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function updateRestaurantPayment(id: string, data: Partial<RestaurantPayment>): Promise<RestaurantPayment | null> {
  const { data: result, error } = await supabase.from('restaurant_payments').update(data).eq('id', id).select().maybeSingle();
  if (error) return handleError(error, null); return result;
}
export async function deleteRestaurantPayment(id: string): Promise<boolean> {
  const { error } = await supabase.from('restaurant_payments').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── STATS ───
export async function getRestaurantStats(): Promise<any> {
  const { count: restaurants } = await supabase.from('restaurant_profiles').select('*', { count: 'exact', head: true });
  const { count: orders } = await supabase.from('restaurant_orders').select('*', { count: 'exact', head: true });
  const { count: menuItems } = await supabase.from('restaurant_menu_items').select('*', { count: 'exact', head: true });
  return { restaurants, orders, menuItems };
}
