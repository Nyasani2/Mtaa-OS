/**
 * ASIS v7 Search Engine
 * Multi-source search aggregation
 * Uses free search APIs + RSS feeds + local knowledge + community patterns
 * No API keys required for basic functionality
 */

import { SearchResult, SearchQuery, SearchFilters, IntentCategory } from '../types';

// ─── Search Sources ─────────────────────────────────────────────

interface SearchSource {
  name: string;
  search: (query: SearchQuery) => Promise<SearchResult[]>;
  priority: number;
  enabled: boolean;
}

// ─── DuckDuckGo Instant Answer API (free, no key) ──────────────

async function duckDuckGoSearch(query: SearchQuery): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query.query)}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const results: SearchResult[] = [];

    // Abstract text
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query.query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
        source: 'DuckDuckGo',
        relevance: 0.95,
        type: 'wiki',
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL || '',
            snippet: topic.Text,
            source: 'DuckDuckGo',
            relevance: 0.7,
            type: 'web',
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.warn('[ASIS Search] DuckDuckGo failed:', error);
    return [];
  }
}

// ─── Wikipedia API (free, no key) ──────────────────────────────

async function wikipediaSearch(query: SearchQuery): Promise<SearchResult[]> {
  try {
    // Search for page
    const searchResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query.query)}&format=json&origin=*&srlimit=5`
    );

    if (!searchResponse.ok) return [];

    const searchData = await searchResponse.json();
    const results: SearchResult[] = [];

    for (const item of searchData.query?.search || []) {
      // Get page extract
      const extractResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&pageids=${item.pageid}&format=json&origin=*`
      );

      let snippet = item.snippet.replace(/<[^>]+>/g, '');
      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        const page = extractData.query?.pages?.[item.pageid];
        if (page?.extract) {
          snippet = page.extract.substring(0, 300) + (page.extract.length > 300 ? '...' : '');
        }
      }

      results.push({
        title: item.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s/g, '_'))}`,
        snippet,
        source: 'Wikipedia',
        relevance: 0.85,
        type: 'wiki',
      });
    }

    return results;
  } catch (error) {
    console.warn('[ASIS Search] Wikipedia failed:', error);
    return [];
  }
}

// ─── News RSS Aggregation (free) ───────────────────────────────

const NEWS_FEEDS: Record<string, string[]> = {
  'africa': [
    'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    'https://www.aljazeera.com/xml/rss/all.xml',
  ],
  'kenya': [
    'https://www.standardmedia.co.ke/rss/kenya.php',
    'https://nation.africa/kenya/rss.xml',
  ],
  'uganda': [
    'https://www.monitor.co.ug/rss.xml',
  ],
  'tanzania': [
    'https://www.thecitizen.co.tz/rss.xml',
  ],
  'nigeria': [
    'https://www.vanguardngr.com/feed/',
  ],
  'global': [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.cnn.com/rss/edition.rss',
    'https://feeds.reuters.com/reuters/topNews',
  ],
  'tech': [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
  ],
};

async function rssNewsSearch(query: SearchQuery): Promise<SearchResult[]> {
  // For news intent, fetch from RSS feeds
  if (query.intent !== 'news') return [];

  const results: SearchResult[] = [];
  const feeds = NEWS_FEEDS[query.filters?.location?.toLowerCase() || 'global'] || NEWS_FEEDS['global'];

  // Note: RSS parsing would require an XML parser
  // For now, return placeholder results indicating RSS capability
  // In production, use react-native-rss-parser or similar

  results.push({
    title: `Latest News: ${query.query}`,
    url: `https://news.google.com/search?q=${encodeURIComponent(query.query)}`,
    snippet: `Fetching latest news about "${query.query}" from ${feeds.length} sources...`,
    source: 'RSS Aggregator',
    relevance: 0.8,
    type: 'news',
    timestamp: Date.now(),
  });

  return results;
}

// ─── Weather Parsing (from search results) ─────────────────────

async function weatherParseSearch(query: SearchQuery): Promise<SearchResult[]> {
  if (query.intent !== 'weather') return [];

  const location = query.entities.find((e: any) => e.type === 'location')?.value || 'current location';

  // Return structured weather placeholder
  // In production, parse from weather sites or use free weather API
  return [{
    title: `Weather in ${location}`,
    url: `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
    snippet: `Current weather data for ${location}. Use wttr.in API for free weather data (no key required).`,
    source: 'Weather Service',
    relevance: 0.9,
    type: 'web',
  }];
}

// ─── Local Knowledge Search ────────────────────────────────────

interface LocalKnowledgeEntry {
  id: string;
  topic: string;
  content: string;
  source: string;
  tags: string[];
  lastAccessed: number;
  accessCount: number;
}

class LocalKnowledgeStore {
  private entries: LocalKnowledgeEntry[] = [];
  private maxEntries = 1000;

  add(entry: Omit<LocalKnowledgeEntry, 'lastAccessed' | 'accessCount'>): void {
    this.entries.push({
      ...entry,
      lastAccessed: Date.now(),
      accessCount: 0,
    });

    // Prune if too many
    if (this.entries.length > this.maxEntries) {
      this.entries.sort((a, b) => a.accessCount - b.accessCount);
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  search(query: string): LocalKnowledgeEntry[] {
    const normalizedQuery = query.toLowerCase();
    const words = normalizedQuery.split(/\s+/);

    return this.entries
      .map((entry: any) => {
        const score = words.filter((word: any) =>
          entry.topic.toLowerCase().includes(word) ||
          entry.content.toLowerCase().includes(word) ||
          entry.tags.some((tag: any) => tag.toLowerCase().includes(word))
        ).length / words.length;

        return { entry, score };
      })
      .filter(({ score }) => score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ entry }) => {
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        return entry;
      });
  }

  getPopularTopics(limit = 20): string[] {
    return this.entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
      .map((e: any) => e.topic);
  }
}

const localKnowledge = new LocalKnowledgeStore();

async function localKnowledgeSearch(query: SearchQuery): Promise<SearchResult[]> {
  const entries = localKnowledge.search(query.query);
  return entries.map((entry: any) => ({
    title: entry.topic,
    url: '',
    snippet: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
    source: entry.source,
    relevance: 0.9,
    type: 'local',
  }));
}

// ─── Community Knowledge (anonymized patterns) ─────────────────

interface CommunityQAPair {
  question: string;
  answer: string;
  intent: IntentCategory;
  helpfulCount: number;
  timestamp: number;
}

class CommunityKnowledgeStore {
  private qaPairs: CommunityQAPair[] = [];

  add(qa: CommunityQAPair): void {
    this.qaPairs.push(qa);
  }

  search(query: string, intent: IntentCategory): CommunityQAPair[] {
    const normalizedQuery = query.toLowerCase();
    return this.qaPairs
      .filter((qa: any) => qa.intent === intent)
      .map((qa: any) => {
        const similarity = this.calculateSimilarity(normalizedQuery, qa.question.toLowerCase());
        return { qa, similarity };
      })
      .filter(({ similarity }) => similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(({ qa }) => qa);
  }

  private calculateSimilarity(a: string, b: string): number {
    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));
    const intersection = new Set([...aWords].filter((x: any) => bWords.has(x)));
    const union = new Set([...aWords, ...bWords]);
    return intersection.size / union.size;
  }

  getTopQA(limit = 50): CommunityQAPair[] {
    return this.qaPairs
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, limit);
  }
}

const communityKnowledge = new CommunityKnowledgeStore();

async function communitySearch(query: SearchQuery): Promise<SearchResult[]> {
  const pairs = communityKnowledge.search(query.query, query.intent);
  return pairs.map((qa: any) => ({
    title: qa.question,
    url: '',
    snippet: qa.answer.substring(0, 200) + (qa.answer.length > 200 ? '...' : ''),
    source: 'Community',
    relevance: 0.75,
    type: 'community',
  }));
}

// ─── Search Engine Class ────────────────────────────────────────

export class SearchEngine {
  private sources: SearchSource[];
  private localKnowledge: LocalKnowledgeStore;
  private communityKnowledge: CommunityKnowledgeStore;

  constructor() {
    this.localKnowledge = localKnowledge;
    this.communityKnowledge = communityKnowledge;

    this.sources = [
      { name: 'local', search: localKnowledgeSearch, priority: 1, enabled: true },
      { name: 'community', search: communitySearch, priority: 2, enabled: true },
      { name: 'duckduckgo', search: duckDuckGoSearch, priority: 3, enabled: true },
      { name: 'wikipedia', search: wikipediaSearch, priority: 4, enabled: true },
      { name: 'news', search: rssNewsSearch, priority: 5, enabled: true },
      { name: 'weather', search: weatherParseSearch, priority: 6, enabled: true },
    ];
  }

  /**
   * Execute multi-source search
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];

    // Execute all enabled sources in parallel
    const promises = this.sources
      .filter((s: any) => s.enabled)
      .map(async source => {
        try {
          const results = await source.search(query);
          return results.map((r: any) => ({ ...r, source: r.source || source.name }));
        } catch (error) {
          console.warn(`[ASIS Search] ${source.name} failed:`, error);
          return [];
        }
      });

    const resultsArrays = await Promise.all(promises);

    for (const results of resultsArrays) {
      allResults.push(...results);
    }

    // Rank and deduplicate
    return this.rankAndDeduplicate(allResults, query);
  }

  /**
   * Quick search for simple queries
   */
  async quickSearch(query: string, intent: IntentCategory = 'general_knowledge'): Promise<SearchResult[]> {
    return this.search({
      query,
      intent,
      entities: [],
    });
  }

  /**
   * Add knowledge to local store
   */
  addLocalKnowledge(entry: Omit<LocalKnowledgeEntry, 'lastAccessed' | 'accessCount'>): void {
    this.localKnowledge.add(entry);
  }

  /**
   * Add community QA pair
   */
  addCommunityQA(qa: CommunityQAPair): void {
    this.communityKnowledge.add(qa);
  }

  private rankAndDeduplicate(results: SearchResult[], query: SearchQuery): SearchResult[] {
    const seen = new Map<string, SearchResult>();

    for (const result of results) {
      const key = `${result.title}:${result.url}`.toLowerCase();
      const existing = seen.get(key);

      if (!existing || result.relevance > existing.relevance) {
        seen.set(key, result);
      }
    }

    // Sort by relevance
    return Array.from(seen.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  /**
   * Get search statistics
   */
  getStats(): { localEntries: number; communityQA: number; sources: string[] } {
    return {
      localEntries: this.localKnowledge.getPopularTopics().length,
      communityQA: this.communityKnowledge.getTopQA().length,
      sources: this.sources.filter((s: any) => s.enabled).map((s: any) => s.name),
    };
  }
}

// ─── Singleton Instance ─────────────────────────────────────────

let searchEngineInstance: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new SearchEngine();
  }
  return searchEngineInstance;
}

// ─── Weather-specific helpers ───────────────────────────────────

export async function fetchWeatherData(location: string): Promise<{
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{ day: string; temp: number; condition: string }>;
} | null> {
  try {
    // Use wttr.in — free weather API, no key required
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const current = data.current_condition?.[0];
    const forecast = data.weather?.slice(0, 5) || [];

    return {
      temperature: parseInt(current?.temp_C || '0'),
      condition: current?.weatherDesc?.[0]?.value || 'Unknown',
      humidity: parseInt(current?.humidity || '0'),
      windSpeed: parseInt(current?.windspeedKmph || '0'),
      forecast: forecast.map((day: any) => ({
        day: day.date,
        temp: parseInt(day.avgtempC || '0'),
        condition: day.hourly?.[4]?.weatherDesc?.[0]?.value || 'Unknown',
      })),
    };
  } catch (error) {
    console.warn('[ASIS Weather] Failed to fetch:', error);
    return null;
  }
}

// ─── News-specific helpers ──────────────────────────────────────

export async function fetchNewsHeadlines(category: string = 'general', region: string = 'africa'): Promise<{
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
}[]> {
  // In production, use RSS parser
  // For now, return structured placeholder
  return [{
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} News — ${region}`,
    source: 'News Aggregator',
    url: `https://news.google.com/search?q=${encodeURIComponent(category)}&hl=en-${region}`,
    publishedAt: new Date().toISOString(),
    summary: `Fetching ${category} news for ${region} region...`,
  }];
}
