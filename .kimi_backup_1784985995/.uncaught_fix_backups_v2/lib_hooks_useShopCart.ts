/**
 * MTAA OS V10 — useShopCart Hook
 * Local cart state + sync to Supabase cart table
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface CartItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  seller_id: string;
}

export function useShopCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useAuthStore((s) => s.session?.user?.id);

  const loadCart = useCallback(async () => {
    if (!userId) { setItems([]); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('shop_carts')
      .select('*')
      .eq('user_id', userId);
    if (!error && data) {
      setItems(data.map((r: any) => ({
        item_id: r.item_id,
        name: r.name,
        price: r.price,
        quantity: r.quantity,
        image: r.image,
        seller_id: r.seller_id,
      })));
    }
    setIsLoading(false);
  }, [userId]);

  const addToCart = useCallback(async (item: Omit<CartItem, 'quantity'>) => {
    if (!userId) throw new Error('Not authenticated');
    const existing = items.find((i) => i.item_id === item.item_id);
    if (existing) {
      const newQty = existing.quantity + 1;
      await supabase.from('shop_carts').update({ quantity: newQty }).eq('user_id', userId).eq('item_id', item.item_id);
      setItems((prev) => prev.map((i) => i.item_id === item.item_id ? { ...i, quantity: newQty } : i));
    } else {
      await supabase.from('shop_carts').insert({ user_id: userId, ...item, quantity: 1 });
      setItems((prev) => [...prev, { ...item, quantity: 1 }]);
    }
  }, [userId, items]);

  const removeFromCart = useCallback(async (itemId: string) => {
    if (!userId) return;
    await supabase.from('shop_carts').delete().eq('user_id', userId).eq('item_id', itemId);
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  }, [userId]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!userId) return;
    if (quantity <= 0) { removeFromCart(itemId); return; }
    await supabase.from('shop_carts').update({ quantity }).eq('user_id', userId).eq('item_id', itemId);
    setItems((prev) => prev.map((i) => i.item_id === itemId ? { ...i, quantity } : i));
  }, [userId, removeFromCart]);

  const clearCart = useCallback(async () => {
    if (!userId) return;
    await supabase.from('shop_carts').delete().eq('user_id', userId);
    setItems([]);
  }, [userId]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => { loadCart(); }, [loadCart]);

  return { items, isLoading, total, count, addToCart, removeFromCart, updateQuantity, clearCart, refresh: loadCart };
}
