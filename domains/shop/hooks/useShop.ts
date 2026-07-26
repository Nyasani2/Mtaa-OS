import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface ShopData {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: string;
  created_at: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  image_url: string | null;
  status: string;
}

export interface ShopOrder {
  id: string;
  shop_id: string;
  customer_id: string;
  total: number;
  status: string;
  created_at: string;
}

export function useShop(shopId?: string) {
  const { user } = useAuthStore();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchShop = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_stores')
        .select('*')
        .eq('id', shopId)
        .single();
      if (!error) setShop(data);
    } catch (e) { /* noop */ }
    setLoading(false);
  }, [shopId]);

  const fetchProducts = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      if (!error) setProducts(data || []);
    } catch (e) { /* noop */ }
    setLoading(false);
  }, [shopId]);

  const fetchOrders = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      if (!error) setOrders(data || []);
    } catch (e) { /* noop */ }
    setLoading(false);
  }, [shopId]);

  const fetchCustomers = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_customers')
        .select('*')
        .eq('shop_id', shopId);
      if (!error) setCustomers(data || []);
    } catch (e) { /* noop */ }
    setLoading(false);
  }, [shopId]);

  const addProduct = useCallback(async (product: Partial<ShopProduct>) => {
    if (!shopId || !user?.id) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .insert({ ...product, shop_id: shopId })
        .select()
        .single();
      if (error) return { error: error.message };
      await fetchProducts();
      return { data };
    } catch (e: any) {
      return { error: e?.message || 'Failed to add product' };
    }
  }, [shopId, user?.id, fetchProducts]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<ShopProduct>) => {
    try {
      const { error } = await supabase
        .from('shop_items')
        .update(updates)
        .eq('id', productId);
      if (error) return { error: error.message };
      await fetchProducts();
      return {};
    } catch (e: any) {
      return { error: e?.message || 'Failed to update product' };
    }
  }, [fetchProducts]);

  return {
    shop, products, orders, customers, loading,
    fetchShop, fetchProducts, fetchOrders, fetchCustomers,
    addProduct, updateProduct,
  };
}
