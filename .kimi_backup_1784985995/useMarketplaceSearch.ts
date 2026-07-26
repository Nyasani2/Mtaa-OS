/**
 * MTAA OS V10 — useMarketplaceSearch Hook
 * Advanced search with filters
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchMarketplaceListings, fetchMarketplaceCategories, MarketplaceListing } from '@/lib/services/marketplace-service';

export function useMarketplaceSearch() {
  const [results, setResults] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
  });

  const search = useCallback(async (override?: Partial<typeof filters>) => {
    const merged = { ...filters, ...override };
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceListings({
        search: merged.search || undefined,
        categoryId: merged.categoryId || undefined,
        condition: merged.condition || undefined,
        minPrice: merged.minPrice ? parseFloat(merged.minPrice) : undefined,
        maxPrice: merged.maxPrice ? parseFloat(merged.maxPrice) : undefined,
      });
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchMarketplaceCategories();
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const setFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    loadCategories();
    search();
  }, []);

  return { results, categories, isLoading, error, filters, setFilter, search, refresh: () => search() };
}
