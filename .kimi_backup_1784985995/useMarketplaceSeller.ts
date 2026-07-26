/**
 * MTAA OS V10 — useMarketplaceSeller Hook
 * Seller dashboard: listings, sales, earnings
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchMarketplaceListings,
  fetchMarketplaceOrders,
  MarketplaceListing,
  MarketplaceOrder,
} from '@/lib/services/marketplace-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useMarketplaceSeller() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [sales, setSales] = useState<MarketplaceOrder[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, revenue: 0, activeListings: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [myListings, mySales] = await Promise.all([
        fetchMarketplaceListings({ sellerId: userId, status: undefined }),
        fetchMarketplaceOrders(userId, 'seller'),
      ]);
      setListings(myListings);
      setSales(mySales);
      setStats({
        totalSales: mySales.filter((o) => o.status === 'delivered').length,
        revenue: mySales.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.amount, 0),
        activeListings: myListings.filter((l) => l.status === 'active').length,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { listings, sales, stats, isLoading, error, refresh: load };
}
