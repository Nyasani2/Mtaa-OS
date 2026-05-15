/**
 * MTAA Search Engine
 * Full-text, faceted, autocomplete, vector search
 * No Elasticsearch — Supabase PostgreSQL + pg_trgm + edge functions only
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────────────

export interface SearchConfig {
  table: string;
  columns: string[];
  weights?: Record<string, number>;
  facets?: string[];
  vectorColumn?: string;
  enableAutocomplete: boolean;
  enableFuzzy: boolean;
  resultLimit: number;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  facets: Record<string, { value: string; count: number }[]>;
  suggestions: string[];
  page: number;
  perPage: number;
  queryTimeMs: number;
}

export interface SearchIndex {
  id: string;
  table_name: string;
  column_name: string;
  index_type: 'text' | 'trgm' | 'vector';
  language: string;
  created_at: string;
}

export interface SearchQuery {
  q: string;
  table?: string;
  facets?: Record<string, string[]>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
  fuzzy?: boolean;
  vector?: boolean;
}

// ─── Default Search Configs ────────────────────────────────

export const SEARCH_CONFIGS: Record<string, SearchConfig> = {
  profiles: {
    table: 'profiles',
    columns: ['full_name', 'bio', 'location', 'skills'],
    weights: { full_name: 1.0, bio: 0.8, location: 0.6, skills: 0.9 },
    facets: ['location', 'kyc_level', 'account_type'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 20,
  },
  civic_projects: {
    table: 'civic_projects',
    columns: ['title', 'description', 'location', 'status'],
    weights: { title: 1.0, description: 0.8, location: 0.6, status: 0.4 },
    facets: ['status', 'category', 'location'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 20,
  },
  jobs: {
    table: 'jobs',
    columns: ['title', 'description', 'requirements', 'location'],
    weights: { title: 1.0, description: 0.8, requirements: 0.7, location: 0.5 },
    facets: ['type', 'location', 'salary_range', 'remote'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 20,
  },
  marketplace: {
    table: 'marketplace_listings',
    columns: ['title', 'description', 'category', 'tags'],
    weights: { title: 1.0, description: 0.8, category: 0.7, tags: 0.9 },
    facets: ['category', 'condition', 'price_range', 'location'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 24,
  },
  shop: {
    table: 'shop_products',
    columns: ['name', 'description', 'category', 'brand'],
    weights: { name: 1.0, description: 0.8, category: 0.7, brand: 0.6 },
    facets: ['category', 'price_range', 'brand', 'rating'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 24,
  },
  tribes: {
    table: 'tribes',
    columns: ['name', 'description', 'topic', 'location'],
    weights: { name: 1.0, description: 0.8, topic: 0.9, location: 0.5 },
    facets: ['topic', 'privacy', 'location', 'member_count_range'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 20,
  },
  education: {
    table: 'education_courses',
    columns: ['title', 'description', 'instructor', 'category'],
    weights: { title: 1.0, description: 0.8, instructor: 0.7, category: 0.6 },
    facets: ['category', 'level', 'duration', 'price_range'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 20,
  },
  health: {
    table: 'health_facilities',
    columns: ['name', 'services', 'location', 'specialty'],
    weights: { name: 1.0, services: 0.9, location: 0.7, specialty: 0.8 },
    facets: ['type', 'specialty', 'location', 'rating'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 20,
  },
  mtaxi: {
    table: 'mtaxi_drivers',
    columns: ['name', 'vehicle_type', 'location', 'license_plate'],
    weights: { name: 1.0, vehicle_type: 0.8, location: 0.9, license_plate: 0.5 },
    facets: ['vehicle_type', 'rating', 'availability'],
    enableAutocomplete: true,
    enableFuzzy: false,
    resultLimit: 20,
  },
  mtruck: {
    table: 'mtruck_drivers',
    columns: ['name', 'vehicle_type', 'capacity', 'location'],
    weights: { name: 1.0, vehicle_type: 0.8, capacity: 0.7, location: 0.9 },
    facets: ['vehicle_type', 'capacity_range', 'rating', 'availability'],
    enableAutocomplete: true,
    enableFuzzy: false,
    resultLimit: 20,
  },
  appstore: {
    table: 'app_store_apps',
    columns: ['name', 'description', 'category', 'tags'],
    weights: { name: 1.0, description: 0.8, category: 0.7, tags: 0.9 },
    facets: ['category', 'rating', 'price', 'platform'],
    enableAutocomplete: true,
    enableFuzzy: true,
    resultLimit: 24,
  },
  messages: {
    table: 'bus_messages',
    columns: ['content', 'topic', 'channel'],
    weights: { content: 1.0, topic: 0.9, channel: 0.5 },
    facets: ['channel', 'topic', 'sender_type'],
    enableAutocomplete: false,
    enableFuzzy: true,
    resultLimit: 50,
  },
};

// ─── Search Engine Class ─────────────────────────────────

export class SearchEngine {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  // ─── Core Search ───────────────────────────────────────

  async search<T = any>(configKey: string, query: SearchQuery): Promise<SearchResult<T>> {
    const config = SEARCH_CONFIGS[configKey];
    if (!config) throw new Error(`Unknown search config: ${configKey}`);

    const startTime = performance.now();
    const page = query.page || 1;
    const perPage = query.perPage || config.resultLimit;
    const offset = (page - 1) * perPage;

    // Build the search via RPC
    const { data, error } = await this.client.rpc('mtaa_search', {
      p_table: config.table,
      p_query: query.q,
      p_columns: config.columns,
      p_weights: config.weights || {},
      p_facets: config.facets || [],
      p_fuzzy: query.fuzzy ?? config.enableFuzzy,
      p_limit: perPage,
      p_offset: offset,
      p_sort: query.sort || 'rank',
      p_order: query.order || 'desc',
      p_facet_filters: query.facets || {},
    });

    if (error) {
      console.error('[Search] Query failed:', error.message);
      return { items: [], total: 0, facets: {}, suggestions: [], page, perPage, queryTimeMs: 0 };
    }

    const queryTimeMs = Math.round(performance.now() - startTime);

    return {
      items: data.items || [],
      total: data.total || 0,
      facets: data.facets || {},
      suggestions: data.suggestions || [],
      page,
      perPage,
      queryTimeMs,
    };
  }

  // ─── Autocomplete ────────────────────────────────────

  async autocomplete(configKey: string, prefix: string, limit: number = 8): Promise<string[]> {
    const config = SEARCH_CONFIGS[configKey];
    if (!config || !config.enableAutocomplete) return [];

    const { data, error } = await this.client.rpc('mtaa_autocomplete', {
      p_table: config.table,
      p_column: config.columns[0],
      p_prefix: prefix,
      p_limit: limit,
    });

    if (error) {
      console.error('[Search] Autocomplete failed:', error.message);
      return [];
    }

    return data || [];
  }

  // ─── Global Search (across all tables) ─────────────

  async globalSearch(q: string, limitPerTable: number = 5): Promise<Record<string, SearchResult>> {
    const results: Record<string, SearchResult> = {};
    const promises = Object.keys(SEARCH_CONFIGS).map(async key => {
      results[key] = await this.search(key, { q, perPage: limitPerTable });
    });
    await Promise.all(promises);
    return results;
  }

  // ─── Index Management ──────────────────────────────

  async createIndex(table: string, column: string, type: 'text' | 'trgm' | 'vector' = 'text'): Promise<boolean> {
    const { error } = await this.client.rpc('mtaa_create_search_index', {
      p_table: table,
      p_column: column,
      p_type: type,
    });
    if (error) { console.error('[Search] Index creation failed:', error.message); return false; }
    return true;
  }

  async listIndexes(): Promise<SearchIndex[]> {
    const { data, error } = await this.client.from('search_indexes').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[Search] List indexes failed:', error.message); return []; }
    return data || [];
  }

  // ─── Search Analytics ──────────────────────────────

  async logSearch(query: string, configKey: string, resultsCount: number, userId?: string): Promise<void> {
    await this.client.from('search_logs').insert({
      query,
      config_key: configKey,
      results_count: resultsCount,
      user_id: userId || null,
    });
  }

  async getPopularQueries(configKey?: string, limit: number = 20): Promise<{ query: string; count: number }[]> {
    let q = this.client.from('search_logs').select('query, count');
    if (configKey) q = q.eq('config_key', configKey);
    const { data, error } = await q.order('count', { ascending: false }).limit(limit);
    if (error) { console.error('[Search] Popular queries failed:', error.message); return []; }
    return data || [];
  }

  async getSearchStats(): Promise<{
    totalQueries: number;
    avgResults: number;
    topQueries: { query: string; count: number }[];
    zeroResultQueries: string[];
  }> {
    const { data: total } = await this.client.from('search_logs').select('*', { count: 'exact', head: true });
    const { data: avg } = await this.client.rpc('mtaa_search_avg_results');
    const { data: top } = await this.client.rpc('mtaa_search_top_queries', { p_limit: 10 });
    const { data: zero } = await this.client.from('search_logs').select('query').eq('results_count', 0).limit(20);

    return {
      totalQueries: total?.length || 0,
      avgResults: avg || 0,
      topQueries: top || [],
      zeroResultQueries: zero?.map(z => z.query) || [],
    };
  }

  // ─── Vector Search (placeholder for pgvector) ──────

  async vectorSearch(configKey: string, embedding: number[], limit: number = 10): Promise<SearchResult> {
    const config = SEARCH_CONFIGS[configKey];
    if (!config || !config.vectorColumn) {
      return { items: [], total: 0, facets: {}, suggestions: [], page: 1, perPage: limit, queryTimeMs: 0 };
    }

    const { data, error } = await this.client.rpc('mtaa_vector_search', {
      p_table: config.table,
      p_column: config.vectorColumn,
      p_embedding: embedding,
      p_limit: limit,
    });

    if (error) {
      console.error('[Search] Vector search failed:', error.message);
      return { items: [], total: 0, facets: {}, suggestions: [], page: 1, perPage: limit, queryTimeMs: 0 };
    }

    return {
      items: data || [],
      total: data?.length || 0,
      facets: {},
      suggestions: [],
      page: 1,
      perPage: limit,
      queryTimeMs: 0,
    };
  }

  // ─── Helpers ───────────────────────────────────────

  getAvailableConfigs(): string[] {
    return Object.keys(SEARCH_CONFIGS);
  }

  getConfig(configKey: string): SearchConfig | undefined {
    return SEARCH_CONFIGS[configKey];
  }
}

// ─── Singleton Export ────────────────────────────────────

let engineInstance: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (!engineInstance) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    engineInstance = new SearchEngine(url, key);
  }
  return engineInstance;
}

