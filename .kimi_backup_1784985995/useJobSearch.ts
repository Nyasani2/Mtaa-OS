/**
 * MTAA OS V10 — useJobSearch Hook
 * Advanced job search with filters + debounce-ready
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchJobListings, fetchJobCategories, JobListing } from '@/lib/services/jobs-service';

export function useJobSearch() {
  const [results, setResults] = useState<JobListing[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    type: '',
    location: '',
  });

  const search = useCallback(async (overrideFilters?: Partial<typeof filters>) => {
    const merged = { ...filters, ...overrideFilters };
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJobListings({
        search: merged.search || undefined,
        categoryId: merged.categoryId || undefined,
        type: merged.type || undefined,
        location: merged.location || undefined,
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
      const data = await fetchJobCategories();
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

  return {
    results, categories, isLoading, error, filters,
    setFilter, search, refresh: () => search(),
  };
}
