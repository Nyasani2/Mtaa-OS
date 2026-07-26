/**
 * MTAA OS V10 — useMarketplace Hook
 * Browse listings, manage seller catalog
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchMarketplaceListings,
  fetchMarketplaceListingById,
  createMarketplaceListing,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  fetchMarketplaceCategories,
  MarketplaceListing,
} from '@/lib/services/marketplace-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useMarketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const loadListings = useCallback(async (filters?: { categoryId?: string; search?: string; condition?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceListings(filters);
      setListings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchMarketplaceCategories();
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const addListing = useCallback(async (payload: Partial<MarketplaceListing>) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await createMarketplaceListing({ ...payload, seller_id: userId });
    setListings((prev) => [item, ...prev]);
    return item;
  }, [userId]);

  const editListing = useCallback(async (id: string, payload: Partial<MarketplaceListing>) => {
    const item = await updateMarketplaceListing(id, payload);
    setListings((prev) => prev.map((l) => (l.id === id ? item : l)));
    return item;
  }, []);

  const removeListing = useCallback(async (id: string) => {
    await deleteMarketplaceListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, []);

  useEffect(() => {
    loadListings();
    loadCategories();
  }, [loadListings, loadCategories]);

  return {
    listings, categories, isLoading, error,
    refresh: loadListings, addListing, editListing, removeListing,
  };
}
