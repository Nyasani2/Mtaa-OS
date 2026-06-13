import { supabase } from '@/lib/supabase';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  cuisine_type: string;
  address: string;
  lat?: number;
  lng?: number;
  phone: string;
  email?: string;
  rating: number;
  review_count: number;
  is_open: boolean;
  opening_hours: Record<string, string>;
  delivery_available: boolean;
  pickup_available: boolean;
  delivery_radius_km: number;
  minimum_order: number;
  status: 'active' | 'closed' | 'suspended';
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_spicy: boolean;
  preparation_time_min: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  items: { menu_item_id: string; quantity: number; special_instructions?: string }[];
  total_amount: number;
  delivery_fee: number;
  tip?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
}

export async function listRestaurants(limit = 20, cuisine_type?: string) {
  const { data, error } = await supabase.functions.invoke('restaurant-operations', {
    body: { action: 'list_restaurants', limit, cuisine_type }
  });
  if (error) throw error;
  return data;
}

export async function getRestaurant(restaurant_id: string) {
  const { data, error } = await supabase.functions.invoke('restaurant-operations', {
    body: { action: 'get_restaurant', restaurant_id }
  });
  if (error) throw error;
  return data;
}

export async function getMenu(restaurant_id: string) {
  const { data, error } = await supabase.functions.invoke('restaurant-operations', {
    body: { action: 'get_menu', restaurant_id }
  });
  if (error) throw error;
  return data;
}

export async function placeOrder(params: Omit<Order, 'id' | 'status' | 'payment_status' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('restaurant-operations', {
    body: { action: 'place_order', ...params }
  });
  if (error) throw error;
  return data;
}

export async function getMyOrders(customer_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('restaurant-operations', {
    body: { action: 'get_my_orders', customer_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(order_id: string, status: Order['status']) {
  const { data, error } = await supabase.functions.invoke('restaurant-operations', {
    body: { action: 'update_order_status', order_id, status }
  });
  if (error) throw error;
  return data;
}

export async function getRestaurantDashboard(restaurant_id: string) {
  const { data, error } = await supabase.functions.invoke('restaurant-operations', {
    body: { action: 'get_dashboard', restaurant_id }
  });
  if (error) throw error;
  return data;
}
