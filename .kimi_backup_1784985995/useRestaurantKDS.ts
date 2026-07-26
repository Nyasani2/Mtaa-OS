/**
 * MTAA OS V10 — useRestaurantKDS Hook
 * Kitchen Display System: pending → preparing → ready
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { updateOrderItemStatus } from '@/lib/services/restaurant-service';

export interface KDSItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  special_instructions: string | null;
  status: 'pending' | 'preparing' | 'ready';
  created_at: string;
  menu_item_name?: string;
  table_number?: string;
  order_type?: string;
}

export function useRestaurantKDS(restaurantId: string) {
  const [items, setItems] = useState<KDSItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('restaurant_order_items')
        .select(`
          *,
          restaurant_orders!inner(id, table_id, type, restaurant_id),
          restaurant_menu_items(name)
        `)
        .eq('restaurant_orders.restaurant_id', restaurantId)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      setItems((data ?? []).map((row: any) => ({
        id: row.id,
        order_id: row.order_id,
        menu_item_id: row.menu_item_id,
        quantity: row.quantity,
        special_instructions: row.special_instructions,
        status: row.status,
        created_at: row.created_at,
        menu_item_name: row.restaurant_menu_items?.name ?? 'Unknown',
        table_number: row.restaurant_orders?.table_id ?? '-',
        order_type: row.restaurant_orders?.type ?? 'dine_in',
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  const advance = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const nextStatus = item.status === 'pending' ? 'preparing' : 'ready';
    await updateOrderItemStatus(itemId, nextStatus);
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: nextStatus } : i)));
  }, [items]);

  const complete = useCallback(async (itemId: string) => {
    await updateOrderItemStatus(itemId, 'ready');
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  return { items, isLoading, error, refresh: load, advance, complete };
}
