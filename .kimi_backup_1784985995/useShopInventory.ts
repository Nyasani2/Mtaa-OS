/**
 * MTAA OS V10 — useShopInventory Hook
 * Seller-side inventory management
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchShopItems, updateShopItem, ShopItem } from '@/lib/services/shop-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useShopInventory() {
  const [inventory, setInventory] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchShopItems({ sellerId: userId, status: undefined });
      setInventory(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const restock = useCallback(async (itemId: string, quantity: number) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');
    const newQty = item.stock_quantity + quantity;
    const updated = await updateShopItem(itemId, {
      stock_quantity: newQty,
      status: newQty > 0 ? 'active' : 'out_of_stock',
    });
    setInventory((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
  }, [inventory]);

  const setStatus = useCallback(async (itemId: string, status: ShopItem['status']) => {
    const updated = await updateShopItem(itemId, { status });
    setInventory((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { inventory, isLoading, error, refresh: load, restock, setStatus };
}
