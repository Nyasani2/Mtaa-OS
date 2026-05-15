/**
 * useSearch Hook
 * React hook for search, autocomplete, facets, and analytics
 */

import { useState, useCallback, useRef } from 'react';
import { SearchEngine, SearchResult, SearchQuery, SEARCH_CONFIGS } from '@/lib/kernel/search-engine';
import { getSearchEngine } from '@/lib/kernel/search-engine';

export interface SearchState<T = any> {
  results: SearchResult<T>;
  isLoading: boolean;
  error: string | null;
}

export function useSearch() {
  const engine = getSearchEngine();
  const [state, setState] = useState<SearchState>({
    results: { items: [], total: 0, facets: {}, suggestions: [], page: 1, perPage: 20, queryTimeMs: 0 },
    isLoading: false,
    error: null,
  });
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Search ──────────────────────────────────────────

  const search = useCallback(async (configKey: string, query: SearchQuery) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const results = await engine.search(configKey, query);
      setState({ results, isLoading: false, error: null });
      // Log search for analytics
      engine.logSearch(query.q, configKey, results.total);
      return results;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      throw err;
    }
  }, [engine]);

  // ─── Autocomplete ────────────────────────────────────

  const autocomplete = useCallback(async (configKey: string, prefix: string, limit: number = 8) => {
    if (prefix.length < 2) { setAutocompleteResults([]); return []; }
    setIsAutocompleteLoading(true);
    try {
      const results = await engine.autocomplete(configKey, prefix, limit);
      setAutocompleteResults(results);
      return results;
    } catch (err) {
      setAutocompleteResults([]);
      return [];
    } finally {
      setIsAutocompleteLoading(false);
    }
  }, [engine]);

  const debouncedAutocomplete = useCallback((configKey: string, prefix: string, limit: number = 8, delay: number = 150) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      autocomplete(configKey, prefix, limit);
    }, delay);
  }, [autocomplete]);

  // ─── Global Search ───────────────────────────────────

  const globalSearch = useCallback(async (q: string, limitPerTable: number = 5) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const results = await engine.globalSearch(q, limitPerTable);
      // Merge all results for display
      const allItems = Object.values(results).flatMap(r => r.items);
      const total = Object.values(results).reduce((sum, r) => sum + r.total, 0);
      setState({
        results: { items: allItems, total, facets: {}, suggestions: [], page: 1, perPage: limitPerTable, queryTimeMs: 0 },
        isLoading: false,
        error: null,
      });
      return results;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      throw err;
    }
  }, [engine]);

  // ─── Facet Helpers ───────────────────────────────────

  const applyFacet = useCallback((configKey: string, query: SearchQuery, facetKey: string, facetValue: string) => {
    const newFacets = { ...(query.facets || {}), [facetKey]: [facetValue] };
    return search(configKey, { ...query, facets: newFacets });
  }, [search]);

  const removeFacet = useCallback((configKey: string, query: SearchQuery, facetKey: string) => {
    const newFacets = { ...(query.facets || {}) };
    delete newFacets[facetKey];
    return search(configKey, { ...query, facets: newFacets });
  }, [search]);

  // ─── Pagination ──────────────────────────────────────

  const nextPage = useCallback((configKey: string, query: SearchQuery) => {
    const next = (query.page || 1) + 1;
    return search(configKey, { ...query, page: next });
  }, [search]);

  const prevPage = useCallback((configKey: string, query: SearchQuery) => {
    const prev = Math.max((query.page || 1) - 1, 1);
    return search(configKey, { ...query, page: prev });
  }, [search]);

  return {
    ...state,
    search,
    autocomplete,
    debouncedAutocomplete,
    autocompleteResults,
    isAutocompleteLoading,
    globalSearch,
    applyFacet,
    removeFacet,
    nextPage,
    prevPage,
    configs: SEARCH_CONFIGS,
    configKeys: engine.getAvailableConfigs(),
  };
}
