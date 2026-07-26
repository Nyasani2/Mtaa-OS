/**
 * MTAA OS V10 — useRestaurant Hook
 * Menu + table + order management for a restaurant
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchRestaurantMenu,
  fetchRestaurantTables,
  fetchRestaurantOrders,
  fetchRestaurantCategories,
  updateTableStatus,
  updateRestaurantOrderStatus,
  createMenuItem,
  updateMenuItem,
  RestaurantMenuItem,
  RestaurantTable,
} from '@/lib/services/restaurant-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useRestaurant(restaurantId: string) {
  const [menu, setMenu] = useState<RestaurantMenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [m, t, o, c] = await Promise.all([
        fetchRestaurantMenu(restaurantId),
        fetchRestaurantTables(restaurantId),
        fetchRestaurantOrders(restaurantId),
        fetchRestaurantCategories(restaurantId),
      ]);
      setMenu(m);
      setTables(t);
      setOrders(o);
      setCategories(c);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  const setTableStatus = useCallback(async (tableId: string, status: RestaurantTable['status']) => {
    const updated = await updateTableStatus(tableId, status);
    setTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)));
  }, []);

  const setOrderStatus = useCallback(async (orderId: string, status: any) => {
    const updated = await updateRestaurantOrderStatus(orderId, status);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
  }, []);

  const addMenuItem = useCallback(async (payload: Partial<RestaurantMenuItem>) => {
    if (!restaurantId) throw new Error('No restaurant');
    const item = await createMenuItem({ ...payload, restaurant_id: restaurantId });
    setMenu((prev) => [...prev, item]);
    return item;
  }, [restaurantId]);

  const editMenuItem = useCallback(async (id: string, payload: Partial<RestaurantMenuItem>) => {
    const item = await updateMenuItem(id, payload);
    setMenu((prev) => prev.map((m) => (m.id === id ? item : m)));
    return item;
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    menu, tables, orders, categories, isLoading, error,
    refresh: load, setTableStatus, setOrderStatus, addMenuItem, editMenuItem,
  };
}
