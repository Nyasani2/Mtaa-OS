import { supabase } from '@/lib/supabase';

export type SearchAction = 'search' | 'suggest' | 'autocomplete' | 'analytics';

export interface SearchSearchParams {
  action: 'search';
  query: string;
  index: 'profiles' | 'jobs' | 'marketplace' | 'shop' | 'tribes' | 'education' | 'health' | 'mtaxi' | 'mtruck' | 'appstore' | 'messages' | 'civic_projects';
  filters?: Record<string, any>;
  facets?: string[];
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface SearchSuggestParams {
  action: 'suggest' | 'autocomplete';
  query: string;
  index: string;
  limit?: number;
}

export interface SearchAnalyticsParams {
  action: 'analytics';
  query: string;
  index: string;
  userId?: string;
  resultsCount?: number;
  clickedResult?: string;
}

export type SearchParams = SearchSearchParams | SearchSuggestParams | SearchAnalyticsParams;

export async function searchOperation(params: SearchParams) {
  const { data, error } = await supabase.functions.invoke('search-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const search = (p: Omit<SearchSearchParams, 'action'>) => 
  searchOperation({ action: 'search', ...p } as SearchSearchParams);

export const searchSuggest = (p: Omit<SearchSuggestParams, 'action'>) => 
  searchOperation({ action: 'suggest', ...p } as SearchSuggestParams);

export const searchAutocomplete = (p: Omit<SearchSuggestParams, 'action'>) => 
  searchOperation({ action: 'autocomplete', ...p } as SearchSuggestParams);

export const searchAnalytics = (p: Omit<SearchAnalyticsParams, 'action'>) => 
  searchOperation({ action: 'analytics', ...p } as SearchAnalyticsParams);
