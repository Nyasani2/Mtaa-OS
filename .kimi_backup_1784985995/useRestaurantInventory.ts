/**
 * MTAA OS V10 — useRestaurantInventory Hook
 * Stock tracking + low-stock alerts
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchRestaurantInventory, updateInventoryStock } from '@/lib/services/restaurant-service';

export function useRestaurantInventory(restaurantId: string) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRestaurantInventory(restaurantId);
      setInventory(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  const adjustStock = useCallback(async (itemId: string, newQuantity: number) => {
    const updated = await updateInventoryStock(itemId, newQuantity);
    setInventory((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
  }, []);

  const lowStock = inventory.filter((i) => (i.quantity_in_stock ?? 0) <= (i.reorder_level ?? 5));

  useEffect(() => { load(); }, [load]);

  return { inventory, lowStock, isLoading, error, refresh: load, adjustStock };
}
