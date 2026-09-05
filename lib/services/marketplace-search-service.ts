import { supabase } from '@/lib/supabase';

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'newest';
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  seller_id: string;
  seller_name: string;
  location: string;
  condition: string;
  category: string;
  created_at: string;
}

export class MarketplaceSearchService {
  async search(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('marketplace_listings')
        .select(`
          id,
          title,
          description,
          price,
          currency,
          images,
          seller_id,
          location,
          condition,
          category,
          created_at,
          seller:user_profiles(first_name, last_name)
        `)
        .eq('status', 'active');

      if (filters.query && filters.query.trim()) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.sortBy === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (filters.sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      } else if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        seller_name: item.seller 
          ? `${item.seller.first_name || ''} ${item.seller.last_name || ''}`.trim()
          : 'Unknown Seller',
        images: Array.isArray(item.images) ? item.images : [],
      }));
    } catch (error: any) {
      console.error('Marketplace search error:', error);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('name')
        .order('name');

      if (error) throw error;
      return (data || []).map((c: any) => c.name);
    } catch (error: any) {
      console.error('getCategories error:', error);
      return ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Other'];
    }
  }
}

export const marketplaceSearchService = new MarketplaceSearchService();
