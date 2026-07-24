// domains/shop/services/shopService.ts
import { supabase } from '@/lib/supabase';

export interface ShopProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  stock: number;
  shop_id: string;
  barcode?: string;
  created_at: string;
}

export interface ShopOrder {
  id: string;
  customer_id: string;
  shop_id: string;
  items: { product_id: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  category: string;
  location?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export class ShopService {
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

  async createOrder(order: Omit<ShopOrder, 'id' | 'created_at'>): Promise<ShopOrder> {
    const { data, error } = await supabase.from('shop_orders').insert(order).select().single();
    if (error) throw error;
    return data;
  }

  async getOrders(shopId?: string, customerId?: string): Promise<ShopOrder[]> {
    let query = supabase.from('shop_orders').select('*');
    if (shopId) query = query.eq('shop_id', shopId);
    if (customerId) query = query.eq('customer_id', customerId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async updateOrderStatus(orderId: string, status: ShopOrder['status']): Promise<void> {
    const { error } = await supabase.from('shop_orders').update({ status }).eq('id', orderId);
    if (error) throw error;
  }

  async confirmDelivery(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'delivered');
  }

  async createProduct(product: Omit<ShopProduct, 'id' | 'created_at'>): Promise<ShopProduct> {
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
}

export const shopService = new ShopService();
export default shopService;
