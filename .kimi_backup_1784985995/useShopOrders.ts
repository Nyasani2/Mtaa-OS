/**
 * MTAA OS V10 — useShopOrders Hook
 * Buyer + seller order management
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchShopOrders, updateShopOrderStatus, ShopOrder } from '@/lib/services/shop-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useShopOrders(role: 'buyer' | 'seller') {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchShopOrders(userId, role);
      setOrders(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, role]);

  const updateStatus = useCallback(async (orderId: string, status: ShopOrder['status']) => {
    try {
      const updated = await updateShopOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { orders, isLoading, error, refresh: load, updateStatus };
}
