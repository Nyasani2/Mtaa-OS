import { supabase } from '@/lib/supabase';
import { Shop, ShopProduct, ShopOrder, AffiliateProgram, ShopAffiliate, POSSession } from '../types';

export class ShopService {
  static async getShopById(id: string): Promise<Shop | null> {
    const { data, error } = await supabase.from('shops').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  static async getMyShops(): Promise<Shop[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('shops').select('*').eq('owner_id', user.id);
    if (error) throw error;
    return data || [];
  }

  static async getProducts(shopId: string): Promise<ShopProduct[]> {
    const { data, error } = await supabase.from('shop_products').select('*').eq('shop_id', shopId);
    if (error) throw error;
    return data || [];
  }

  static async getProductByBarcode(shopId: string, barcode: string): Promise<ShopProduct | null> {
    const { data, error } = await supabase.from('shop_products').select('*').eq('shop_id', shopId).eq('barcode', barcode).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createProduct(data: Partial<ShopProduct>): Promise<ShopProduct> {
    const { data: result, error } = await supabase.from('shop_products').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async updateProduct(id: string, data: Partial<ShopProduct>): Promise<ShopProduct> {
    const { data: result, error } = await supabase.from('shop_products').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  static async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('shop_products').delete().eq('id', id);
    if (error) throw error;
  }

  static async getOrders(shopId: string, status?: string): Promise<ShopOrder[]> {
    let query = supabase.from('shop_orders').select('*').eq('shop_id', shopId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createOrder(data: Partial<ShopOrder>): Promise<ShopOrder> {
    const { data: result, error } = await supabase.from('shop_orders').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase.from('shop_orders').update({ status }).eq('id', orderId);
    if (error) throw error;
  }

  static async confirmDelivery(orderId: string): Promise<void> {
    const { error } = await supabase.from('shop_orders').update({
      status: 'delivered',
      delivered_at: new Date().toISOString()
    }).eq('id', orderId);
    if (error) throw error;
  }

  static async getActivePosSession(shopId: string): Promise<POSSession | null> {
    const { data, error } = await supabase.from('pos_sessions')
      .select('*')
      .eq('shop_id', shopId)
      .eq('status', 'active')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async openPosSession(shopId: string, cashierId: string): Promise<POSSession> {
    const { data: result, error } = await supabase.from('pos_sessions').insert({
      shop_id: shopId,
      cashier_id: cashierId,
      status: 'active',
      opened_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return result;
  }

  static async closePosSession(sessionId: string): Promise<void> {
    const { error } = await supabase.from('pos_sessions').update({
      status: 'closed',
      closed_at: new Date().toISOString()
    }).eq('id', sessionId);
    if (error) throw error;
  }

  static async searchMarketplace(query: string, category?: string): Promise<ShopProduct[]> {
    let dbQuery = supabase.from('shop_products').select('*, shops(name, location)').eq('is_listed', true);
    if (query) dbQuery = dbQuery.ilike('name', `%${query}%`);
    if (category) dbQuery = dbQuery.eq('category', category);
    const { data, error } = await dbQuery;
    if (error) throw error;
    return data || [];
  }
}
