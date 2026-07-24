import { supabase } from '@/lib/supabase';
import { SEARCH_CONFIGS } from '@/types/module.types';
import type { SearchQuery, SearchResult, SearchResultItem, SearchConfig } from '@/types/module.types';

export class SearchEngine {
  private configs: SearchConfig[];

  constructor() {
    this.configs = SEARCH_CONFIGS as SearchConfig[];
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const start = Date.now();
    const config = this.configs.find((c: SearchConfig) => c.id === query.domain);
    if (!config) {
      return { items: [], total: 0, query, duration: Date.now() - start };
    }

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

  async searchAll(query: SearchQuery): Promise<Record<string, SearchResult>> {
    const results: Record<string, SearchResult> = {};
    for (const config of this.configs) {
      results[config.id] = await this.search({ ...query, domain: config.id });
    }
    return results;
  }
}

let engineInstance: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (!engineInstance) {
    engineInstance = new SearchEngine();
  }
  return engineInstance;
}

export function resetSearchEngine(): void {
  engineInstance = null;
}

export { SEARCH_CONFIGS };
export type { SearchQuery, SearchResult, SearchResultItem, SearchConfig };
