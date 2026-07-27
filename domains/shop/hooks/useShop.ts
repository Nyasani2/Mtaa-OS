// domains/shop/hooks/useShop.ts
// Shop module hook for MTAA Commerce
// Imported by: shop/[id]/accounting, customers, inventory, settings, wallet, shop/[id]/wallet

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  category: string;
  logo_url?: string;
  banner_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock_quantity: number;
  category: string;
  images: string[];
  status: 'active' | 'out_of_stock' | 'discontinued';
  created_at: string;
}

export interface ShopOrder {
  id: string;
  shop_id: string;
  customer_id: string;
  items: any[];
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shipping_address?: string;
  created_at: string;
  updated_at?: string;
}

export interface ShopCustomer {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  created_at: string;
}

export interface ShopAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  avgOrderValue: number;
  conversionRate: number;
  monthlyRevenue: { month: string; amount: number }[];
}

export function useShop(shopId?: string) {
  const user = useAuthStore((s) => s.user);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [customers, setCustomers] = useState<ShopCustomer[]>([]);
  const [analytics, setAnalytics] = useState<ShopAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShop = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_stores')
        .select('*')
        .eq('id', id)
        .single();
      if (err) throw err;
      setShop(data as Shop);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_products')
        .select('*')
        .eq('shop_id', id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setProducts((data || []) as ShopProduct[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_orders')
        .select('*')
        .eq('shop_id', id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setOrders((data || []) as ShopOrder[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_customers')
        .select('*')
        .eq('shop_id', id)
        .order('total_spent', { ascending: false });
      if (err) throw err;
      setCustomers((data || []) as ShopCustomer[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Aggregate from orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('shop_orders')
        .select('total, created_at')
        .eq('shop_id', id)
        .eq('status', 'delivered');
      if (ordersErr) throw ordersErr;

      const { data: productsData, error: productsErr } = await supabase
        .from('shop_products')
        .select('id')
        .eq('shop_id', id);
      if (productsErr) throw productsErr;

      const { data: customersData, error: customersErr } = await supabase
        .from('shop_customers')
        .select('id, total_spent')
        .eq('shop_id', id);
      if (customersErr) throw customersErr;

      const totalRevenue = (ordersData || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const totalOrders = (ordersData || []).length;
      const totalProducts = (productsData || []).length;
      const totalCustomers = (customersData || []).length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Monthly revenue aggregation
      const monthlyMap: Record<string, number> = {};
      (ordersData || []).forEach((o: any) => {
        const month = o.created_at?.substring(0, 7) || 'unknown';
        monthlyMap[month] = (monthlyMap[month] || 0) + (o.total || 0);
      });
      const monthlyRevenue = Object.entries(monthlyMap)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        avgOrderValue,
        conversionRate: 0, // Requires page view tracking
        monthlyRevenue,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShop = useCallback(async (id: string, updates: Partial<Shop>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_stores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      setShop(data as Shop);
      return data as Shop;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (product: Partial<ShopProduct>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_products')
        .insert(product)
        .select()
        .single();
      if (err) throw err;
      const newProduct = data as ShopProduct;
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (productId: string, updates: Partial<ShopProduct>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();
      if (err) throw err;
      const updated = data as ShopProduct;
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      return updated;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('shop_products').delete().eq('id', productId);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: ShopOrder['status']) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('shop_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();
      if (err) throw err;
      const updated = data as ShopOrder;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      return updated;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shopId) {
      fetchShop(shopId);
      fetchProducts(shopId);
      fetchOrders(shopId);
      fetchCustomers(shopId);
      fetchAnalytics(shopId);
    }
  }, [shopId]);

  return {
    shop,
    products,
    orders,
    customers,
    analytics,
    loading,
    error,
    fetchShop,
    fetchProducts,
    fetchOrders,
    fetchCustomers,
    fetchAnalytics,
    updateShop,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
  };
}

export default useShop;
