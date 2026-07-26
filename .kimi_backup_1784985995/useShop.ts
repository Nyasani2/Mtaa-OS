/**
 * MTAA OS V10 — useShop Hook
 * Browse items, manage seller catalog
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchShopItems,
  fetchShopItemById,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  fetchShopCategories,
  ShopItem,
} from '@/lib/services/shop-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useShop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const loadItems = useCallback(
    async (filters?: { categoryId?: string; search?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchShopItems(filters);
        setItems(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchShopCategories();
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const addItem = useCallback(
    async (payload: Partial<ShopItem>) => {
      if (!userId) throw new Error('Not authenticated');
      const item = await createShopItem({ ...payload, seller_id: userId });
      setItems((prev) => [item, ...prev]);
      return item;
    },
    [userId]
  );

  const editItem = useCallback(async (id: string, payload: Partial<ShopItem>) => {
    const item = await updateShopItem(id, payload);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
    return item;
  }, []);

  const removeItem = useCallback(async (id: string) => {
    await deleteShopItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems, loadCategories]);

  return {
    items,
    categories,
    isLoading,
    error,
    refresh: loadItems,
    addItem,
    editItem,
    removeItem,
  };
}
