import { supabase } from '@/lib/supabase';

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  created_at: string;
  updated_at?: string;
}

export interface ShippingAddress {
  id?: string;
  user_id?: string;
  label?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
  created_at?: string;
}

export interface CartService {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'cart_id' | 'created_at' | 'total_price'>) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  calculateTotals: () => { subtotal: number; tax: number; shipping: number; total: number };
  checkout: (shippingAddress: ShippingAddress, paymentMethod: string) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  loading: boolean;
  error: string | null;
}

export function useCartService(): CartService {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = async (item: Omit<CartItem, 'id' | 'cart_id' | 'created_at' | 'total_price'>) => {
    setLoading(true);
    try {
      const total_price = item.quantity * item.unit_price;
      const { data, error: err } = await supabase
        .from('cart_items')
        .insert({ ...item, total_price })
        .select()
        .single();
      if (err) throw err;
      setItems((prev) => [...prev, data as CartItem]);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const { error: err } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (err) throw err;
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;
      const total_price = quantity * item.unit_price;
      const { data, error: err } = await supabase
        .from('cart_items')
        .update({ quantity, total_price })
        .eq('id', itemId)
        .select()
        .single();
      if (err) throw err;
      setItems((prev) => prev.map((i) => (i.id === itemId ? (data as CartItem) : i)));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const { error: err } = await supabase.from('cart_items').delete().in('id', items.map((i) => i.id));
      if (err) throw err;
      setItems([]);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.16; // 16% VAT
    const shipping = subtotal > 5000 ? 0 : 300;
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  };

  const checkout = async (shippingAddress: ShippingAddress, paymentMethod: string) => {
    setLoading(true);
    try {
      const totals = calculateTotals();
      const { data: order, error: orderErr } = await supabase
        .from('shop_orders')
        .insert({
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.unit_price })),
          total: totals.total,
          currency: items[0]?.currency || 'KES',
          status: 'pending',
          shipping_address: JSON.stringify(shippingAddress),
        })
        .select()
        .single();
      if (orderErr) throw orderErr;
      await clearCart();
      return { success: true, orderId: order.id };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    calculateTotals,
    checkout,
    loading,
    error,
  };
}

import { useState } from 'react';
