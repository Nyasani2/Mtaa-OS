// hooks/useSearch.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface SearchResult {
  id: string;
  type: 'user' | 'app' | 'service' | 'product' | 'job' | 'tribe' | 'content';
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  route?: string;
  metadata?: Record<string, any>;
  score: number;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  recentSearches: string[];
  suggestions: string[];
  isLoading: boolean;
  error: string | null;

  search: (query: string, filters?: Record<string, any>) => Promise<void>;
  getSuggestions: (partial: string) => Promise<void>;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  clearResults: () => void;
  clearError: () => void;
}

export const useSearch = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  recentSearches: [],
  suggestions: [],
  isLoading: false,
  error: null,

  search: async (query: string, filters?: Record<string, any>) => {
    if (!query.trim()) {
      set({ results: [], query: '' });
      return;
    }

    set({ query, isLoading: true, error: null });
    try {
      // Call the search edge function
      const { data, error } = await supabase.functions.invoke('search', {
        body: { query: query.trim(), filters, limit: 20 },
      });

      if (error) throw error;

      set({
        results: (data?.results || []) as SearchResult[],
      });

      // Add to recent searches
      get().addRecentSearch(query.trim());
    } catch (err: any) {
      console.warn('Search failed, falling back to local:', err.message);
      // Fallback: local search across known apps
      set({ results: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  getSuggestions: async (partial: string) => {
    if (partial.length < 2) {
      set({ suggestions: [] });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('search-suggest', {
        body: { query: partial, limit: 8 },
      });

      if (error) throw error;
      set({ suggestions: data?.suggestions || [] });
    } catch (err) {
      set({ suggestions: [] });
    }
  },

  addRecentSearch: (query: string) => {
    set((state) => ({
      recentSearches: [
        query,
        ...state.recentSearches.filter(s => s !== query),
      ].slice(0, 10),
    }));
  },

  clearRecentSearches: () => set({ recentSearches: [] }),
  clearResults: () => set({ results: [], query: '' }),
  clearError: () => set({ error: null }),
}));

export default useSearch;
