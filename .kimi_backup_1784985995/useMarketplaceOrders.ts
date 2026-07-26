/**
 * MTAA OS V10 — useMarketplaceOrders Hook
 * Buyer + seller order management + dispute
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchMarketplaceOrders, updateMarketplaceOrderStatus, MarketplaceOrder } from '@/lib/services/marketplace-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useMarketplaceOrders(role: 'buyer' | 'seller') {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceOrders(userId, role);
      setOrders(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, role]);

  const updateStatus = useCallback(async (orderId: string, status: MarketplaceOrder['status']) => {
    try {
      const updated = await updateMarketplaceOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const dispute = useCallback(async (orderId: string, reason: string) => {
    if (!userId) throw new Error('Not authenticated');
    const { supabase } = await import('@/lib/supabase/client');
    await supabase.from('marketplace_disputes').insert({
      order_id: orderId,
      raised_by: userId,
      reason,
      status: 'open',
    });
    await updateStatus(orderId, 'disputed');
  }, [userId, updateStatus]);

  useEffect(() => { load(); }, [load]);

  return { orders, isLoading, error, refresh: load, updateStatus, dispute };
}
