// domains/stay/hooks/useStaySearch.ts

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface StaySearchFilters {
  query?: string;
  type?: 'short_stay' | 'long_term' | 'commercial' | 'hotel' | 'all';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  amenities?: string[];
  furnished?: boolean;
  petFriendly?: boolean;
  availableNow?: boolean;
}

export interface StaySearchResult {
  id: string;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price_per_night?: number;
  price_per_month?: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  town: string;
  full_address: string;
  cover_image?: string;
  amenities: string[];
  furnished: boolean;
  owner_id: string;
  average_rating: number;
  review_count: number;
  created_at: string;
}

export function useStaySearch() {
  const [results, setResults] = useState<StaySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (filters: StaySearchFilters, page: number = 1, limit: number = 20) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .is('deleted_at', null);

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,town.ilike.%${filters.query}%`);
      }
      if (filters.type && filters.type !== 'all') {
        query = query.eq('listing_type', filters.type);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price_per_night', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price_per_night', filters.maxPrice);
      }
      if (filters.bedrooms !== undefined) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters.bathrooms !== undefined) {
        query = query.gte('bathrooms', filters.bathrooms);
      }
      if (filters.location) {
        query = query.or(`town.ilike.%${filters.location}%,county.ilike.%${filters.location}%,street.ilike.%${filters.location}%`);
      }
      if (filters.furnished !== undefined) {
        query = query.eq('furnished', filters.furnished);
      }

      const from = (page - 1) * limit;
      const { data, error: err, count } = await query
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (err) throw err;

      const mapped: StaySearchResult[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        property_type: p.property_type,
        listing_type: p.listing_type,
        price_per_night: p.price_per_night,
        price_per_month: p.price_per_month,
        currency: p.currency || 'KES',
        bedrooms: p.bedrooms || 0,
        bathrooms: p.bathrooms || 0,
        square_feet: p.square_feet,
        town: p.town,
        full_address: p.full_address,
        cover_image: p.cover_image,
        amenities: p.amenities || [],
        furnished: p.furnished || false,
        owner_id: p.owner_id,
        average_rating: p.average_rating || 0,
        review_count: p.review_count || 0,
        created_at: p.created_at,
      }));

      setResults((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      setTotal(count || 0);
      setHasMore((count || 0) > page * limit);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setHasMore(true);
    setTotal(0);
  }, []);

  return { results, loading, error, hasMore, total, search, clearResults };
}

export default useStaySearch;
