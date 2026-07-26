/**
 * MTAA OS V10 — useShopPOS Hook
 * Point-of-sale: quick sell, scan, receipt generation
 */
import { useCallback, useState } from 'react';
import { createShopOrder, ShopItem } from '@/lib/services/shop-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface POSLineItem {
  item: ShopItem;
  quantity: number;
}

export function useShopPOS() {
  const [cart, setCart] = useState<POSLineItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const addItem = useCallback((item: ShopItem, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) => l.item.id === item.id ? { ...l, quantity: l.quantity + qty } : l);
      }
      return [...prev, { item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== itemId));
  }, []);

  const updateQty = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) { removeItem(itemId); return; }
    setCart((prev) => prev.map((l) => l.item.id === itemId ? { ...l, quantity: qty } : l));
  }, [removeItem]);

  const clear = useCallback(() => { setCart([]); setReceipt(null); }, []);

  const checkout = useCallback(async (buyerId?: string) => {
    if (!userId || cart.length === 0) throw new Error('Invalid checkout');
    setIsProcessing(true);
    try {
      const order = await createShopOrder({
        buyer_id: buyerId ?? userId,
        seller_id: userId,
        items: cart.map((l) => ({ item_id: l.item.id, quantity: l.quantity, unit_price: l.item.price })),
      });
      setReceipt(order);
      setCart([]);
      return order;
    } finally {
      setIsProcessing(false);
    }
  }, [userId, cart]);

  const subtotal = cart.reduce((sum, l) => sum + l.item.price * l.quantity, 0);

  return {
    cart, subtotal,
    itemCount: cart.reduce((sum, l) => sum + l.quantity, 0),
    isProcessing, receipt,
    addItem, removeItem, updateQty, clear, checkout,
  };
}
