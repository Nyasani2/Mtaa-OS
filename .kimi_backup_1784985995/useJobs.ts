/**
 * MTAA OS V10 — useJobs Hook
 * Browse and manage job listings
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchJobListings,
  fetchJobListingById,
  createJobListing,
  updateJobListing,
  deleteJobListing,
  fetchJobCategories,
  JobListing,
} from '@/lib/services/jobs-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useJobs() {
  const [listings, setListings] = useState<JobListing[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const loadListings = useCallback(async (filters?: { categoryId?: string; type?: string; search?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJobListings(filters);
      setListings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchJobCategories();
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const addListing = useCallback(async (payload: Partial<JobListing>) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await createJobListing({ ...payload, employer_id: userId });
    setListings((prev) => [item, ...prev]);
    return item;
  }, [userId]);

  const editListing = useCallback(async (id: string, payload: Partial<JobListing>) => {
    const item = await updateJobListing(id, payload);
    setListings((prev) => prev.map((l) => (l.id === id ? item : l)));
    return item;
  }, []);

  const removeListing = useCallback(async (id: string) => {
    await deleteJobListing(id);
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
