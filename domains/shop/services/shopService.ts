// domains/shop/services/shopService.ts
// MTAA Shop Service — Canonical domain service
// Aligned with supabase/migrations/20240601000018_shop_module.sql

import { supabase } from '@/lib/supabase/client';

// ============================================================
// INTERFACES — Aligned with database schema
// ============================================================

export interface ShopSettings {
  currency: string;
  tax_rate: number;
  allow_pickup: boolean;
  allow_delivery: boolean;
  delivery_radius_km: number;
  min_order_amount: number;
  pos_enabled: boolean;
  affiliate_enabled: boolean;
  escrow_enabled: boolean;
  auto_accept_orders: boolean;
  public_shop_id?: string;
  qr_payload?: string;
  [key: string]: any;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  sub_categories?: string[];
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  registration_number?: string;
  tax_number?: string;
  business_type?: string;
  operating_hours?: Record<string, { open: string; close: string; closed: boolean }> | any;
  settings?: ShopSettings | any;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  rating?: number;
  review_count?: number;
  total_sales?: number;
  total_orders?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopStaff {
  id?: string;
  shop_id: string;
  user_id?: string;
  email?: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'inventory_manager' | 'delivery_agent';
  permissions?: string[] | any;
  pin_code?: string;
  is_active?: boolean;
  last_login_at?: string;
  created_at?: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  qr_code?: string;
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  tax_inclusive?: boolean;
  stock_quantity?: number;
  stock_alert_level?: number;
  track_inventory?: boolean;
  allow_backorders?: boolean;
  variants?: any[];
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_digital?: boolean;
  view_count?: number;
  sales_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopOrder {
  id: string;
  shop_id: string;
  customer_id?: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_notes?: string;
  subtotal: number;
  tax_amount?: number;
  delivery_fee?: number;
  discount_amount?: number;
  total_amount: number;
  payment_status?: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
  payment_method?: string;
  escrow_enabled?: boolean;
  escrow_account_id?: string;
  escrow_released_at?: string;
  affiliate_id?: string;
  affiliate_commission?: number;
  delivery_type?: 'pickup' | 'delivery' | 'shipping';
  delivery_agent_id?: string;
  delivered_at?: string;
  delivery_receipt_scanned?: boolean;
  delivery_receipt_url?: string;
  pos_session_id?: string;
  is_pos_order?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// SERVICE CLASS
// ============================================================

export class ShopService {
  // ── Shops ────────────────────────────────────────────────

  async getShops(): Promise<Shop[]> {
    const { data, error } = await supabase.from('shops').select('*');
    if (error) throw error;
    return data ?? [];
  }

  async getShopById(id: string): Promise<Shop | null> {
    const { data, error } = await supabase.from('shops').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async getShopBySlug(slug: string): Promise<Shop | null> {
    const { data, error } = await supabase.from('shops').select('*').eq('slug', slug).single();
    if (error) return null;
    return data;
  }

  async getShopsByOwner(ownerId: string): Promise<Shop[]> {
    const { data, error } = await supabase.from('shops').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    return data ?? [];
  }

  async createShop(shop: Omit<Shop, 'id' | 'created_at' | 'updated_at'>): Promise<Shop> {
    const { data, error } = await supabase.from('shops').insert(shop).select().single();
    if (error) throw error;
    return data;
  }

  async updateShop(id: string, updates: Partial<Shop>): Promise<Shop> {
    const { data, error } = await supabase.from('shops').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteShop(id: string): Promise<void> {
    const { error } = await supabase.from('shops').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Staff ────────────────────────────────────────────────

  async getShopStaff(shopId: string): Promise<ShopStaff[]> {
    const { data, error } = await supabase.from('shop_staff').select('*').eq('shop_id', shopId);
    if (error) throw error;
    return data ?? [];
  }

  async addShopStaff(staff: Omit<ShopStaff, 'id' | 'created_at'>): Promise<ShopStaff> {
    const { data, error } = await supabase.from('shop_staff').insert(staff).select().single();
    if (error) throw error;
    return data;
  }

  async updateShopStaff(id: string, updates: Partial<ShopStaff>): Promise<void> {
    const { error } = await supabase.from('shop_staff').update(updates).eq('id', id);
    if (error) throw error;
  }

  async removeShopStaff(id: string): Promise<void> {
    const { error } = await supabase.from('shop_staff').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Products ─────────────────────────────────────────────

  async getProducts(shopId?: string): Promise<ShopProduct[]> {
    let query = supabase.from('shop_products').select('*');
    if (shopId) query = query.eq('shop_id', shopId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getProductById(id: string): Promise<ShopProduct | null> {
    const { data, error } = await supabase.from('shop_products').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async getProductByBarcode(shopId: string, barcode: string): Promise<ShopProduct | null> {
    const { data, error } = await supabase
      .from('shop_products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('barcode', barcode)
      .single();
    if (error) return null;
    return data;
  }

  async createProduct(product: Omit<ShopProduct, 'id' | 'created_at' | 'updated_at'>): Promise<ShopProduct> {
    const { data, error } = await supabase.from('shop_products').insert(product).select().single();
    if (error) throw error;
    return data;
  }

  async updateProduct(id: string, updates: Partial<ShopProduct>): Promise<void> {
    const { error } = await supabase.from('shop_products').update(updates).eq('id', id);
    if (error) throw error;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('shop_products').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Orders ───────────────────────────────────────────────

  async getOrders(shopId?: string, customerId?: string): Promise<ShopOrder[]> {
    let query = supabase.from('shop_orders').select('*');
    if (shopId) query = query.eq('shop_id', shopId);
    if (customerId) query = query.eq('customer_id', customerId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getOrderById(id: string): Promise<ShopOrder | null> {
    const { data, error } = await supabase.from('shop_orders').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async createOrder(order: Omit<ShopOrder, 'id' | 'created_at' | 'updated_at'>): Promise<ShopOrder> {
    const { data, error } = await supabase.from('shop_orders').insert(order).select().single();
    if (error) throw error;
    return data;
  }

  async updateOrderStatus(orderId: string, status: ShopOrder['status']): Promise<void> {
    const { error } = await supabase.from('shop_orders').update({ status }).eq('id', orderId);
    if (error) throw error;
  }

  async confirmDelivery(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'delivered');
  }

  // ── Analytics ────────────────────────────────────────────

  async getShopRevenue(shopId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('shop_orders')
      .select('total_amount')
      .eq('shop_id', shopId)
      .eq('payment_status', 'paid');
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).reduce((sum, row) => sum + (row.total_amount || 0), 0);
  }

  async getShopOrderCount(shopId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('shop_orders')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  async getTopProducts(shopId: string, limit: number = 5): Promise<{ name: string; sales: number; revenue: number }[]> {
    const { data, error } = await supabase
      .from('shop_order_items')
      .select('product_name, quantity, total_price, shop_orders!inner(shop_id)')
      .eq('shop_orders.shop_id', shopId)
      .limit(100);
    if (error) throw error;

    const agg = new Map<string, { sales: number; revenue: number }>();
    for (const row of data ?? []) {
      const existing = agg.get(row.product_name) || { sales: 0, revenue: 0 };
      existing.sales += row.quantity || 0;
      existing.revenue += row.total_price || 0;
      agg.set(row.product_name, existing);
    }

    return Array.from(agg.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}

export const shopService = new ShopService();
export default shopService;
