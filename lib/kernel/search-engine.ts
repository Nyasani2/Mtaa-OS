// lib/kernel/search-engine.ts
import { supabase } from '@/lib/supabase/client';
import type { SearchQuery, SearchResult, SearchResultItem, SearchConfig, SEARCH_CONFIGS } from '@/types/module.types';

export async function searchAll(query: SearchQuery): Promise<SearchResult> {
  const start = Date.now();
  const items: SearchResultItem[] = [];

  for (const config of (SEARCH_CONFIGS as SearchConfig[])) {
    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .textSearch(config.columns.join(' || '), query.q)
      .limit(query.limit ?? 10);

    if (!error && data) {
      data.forEach((row: Record<string, unknown>) => {
        items.push({
          id: String(row.id ?? ''),
          type: config.id,
          title: String(row[config.columns[0]] ?? ''),
          subtitle: config.columns[1] ? String(row[config.columns[1]] ?? '') : undefined,
          score: 1.0,
          data: row,
        });
      });
    }
  }

  return {
    items: items.slice(0, query.limit ?? 20),
    total: items.length,
    query,
    duration: Date.now() - start,
  };
}

export async function searchDomain(domain: string, query: SearchQuery): Promise<SearchResult> {
  const config = (SEARCH_CONFIGS as SearchConfig[]).find((c: SearchConfig) => c.id === domain);
  if (!config) return { items: [], total: 0, query, duration: 0 };

  const start = Date.now();
  const { data, error } = await supabase
    .from(config.table)
    .select('*')
    .textSearch(config.columns.join(' || '), query.q)
    .limit(query.limit ?? 10);

  if (error || !data) {
    return { items: [], total: 0, query, duration: Date.now() - start };
  }

  const items: SearchResultItem[] = data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ''),
    type: config.id,
    title: String(row[config.columns[0]] ?? ''),
    subtitle: config.columns[1] ? String(row[config.columns[1]] ?? '') : undefined,
    score: 1.0,
    data: row,
  }));

  return { items, total: items.length, query, duration: Date.now() - start };
}

export function getSearchConfig(domain: string): SearchConfig | undefined {
  return (SEARCH_CONFIGS as SearchConfig[]).find((c: SearchConfig) => c.id === domain);
}

export function listSearchDomains(): string[] {
  return (SEARCH_CONFIGS as SearchConfig[]).map((c: SearchConfig) => c.id);
}
