import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchEngine, SearchResult, SearchQuery, SEARCH_CONFIGS } from '@/lib/kernel/search-engine';
import { getSearchEngine } from '@/lib/kernel/search-engine';

export { SEARCH_CONFIGS };
export type { SearchResult, SearchQuery };

export function useSearch() {
  const [results, setResults] = useState<Record<string, SearchResult>>({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineRef = useRef<SearchEngine | null>(null);

  useEffect(() => {
    engineRef.current = getSearchEngine();
  }, []);

  const search = useCallback(async (q: string, domain?: string) => {
    if (!q.trim()) {
      setResults({});
      return;
    }
    setLoading(true);
    try {
      const engine = engineRef.current ?? getSearchEngine();
      const searchQuery: SearchQuery = { q, domain, limit: 20 };
      const result = await engine.search(searchQuery);
      setResults((prev) => ({ ...prev, [result.query.domain || 'all']: result }));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (q: string, domain?: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(q, domain), 300);
    },
    [search]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const allItems = Object.values(results).flatMap((r: SearchResult) => r.items);
  const total = Object.values(results).reduce((sum: number, r: SearchResult) => sum + r.total, 0);

  return {
    results,
    allItems,
    total,
    loading,
    query,
    setQuery,
    search,
    debouncedSearch,
  };
}
