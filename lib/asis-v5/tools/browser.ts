import { Platform } from 'react-native';

// CORS-enabled endpoints for web search
const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKIPEDIA_SEARCH = 'https://en.wikipedia.org/w/api.php';
const DUCKDUCKGO_API = 'https://api.duckduckgo.com';

export interface WebResult {
  title: string;
  extract: string;
  source: string;
  url: string;
  relevance: number;
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Calculate semantic relevance between query and result
function calculateRelevance(query: string, title: string, extract: string): number {
  const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const tWords = title.toLowerCase().split(/\s+/);
  const eWords = extract.toLowerCase().split(/\s+/);

  let titleScore = 0;
  let extractScore = 0;

  for (const qw of qWords) {
    // Title match (high weight)
    if (tWords.some(tw => tw.includes(qw) || qw.includes(tw))) titleScore += 3;
    // Extract match (medium weight)
    if (eWords.some(ew => ew.includes(qw) || qw.includes(ew))) extractScore += 1;
  }

  // Penalize if title is completely unrelated
  const titleOverlap = qWords.filter(qw => 
    tWords.some(tw => tw.includes(qw) || qw.includes(tw))
  ).length;

  if (titleOverlap === 0 && qWords.length > 1) {
    // Check if any query word appears in extract
    const extractOverlap = qWords.filter(qw => 
      eWords.some(ew => ew.includes(qw) || qw.includes(ew))
    ).length;
    if (extractOverlap === 0) return 0; // Completely irrelevant
  }

  return Math.min(100, (titleScore + extractScore) * 10);
}

export class BrowserTool {
  private cache: Map<string, { results: WebResult[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutes

  async searchWeb(query: string): Promise<WebResult[]> {
    // Check cache
    const cached = this.cache.get(query);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }

    const results: WebResult[] = [];

    try {
      // 1. Try Wikipedia direct page lookup
      const directResult = await this.fetchWikipediaDirect(query);
      if (directResult) results.push(directResult);
    } catch (e) {
      // Silent fail, try next
    }

    try {
      // 2. Try Wikipedia search API
      const searchResults = await this.fetchWikipediaSearch(query);
      results.push(...searchResults);
    } catch (e) {
      // Silent fail
    }

    try {
      // 3. Try DuckDuckGo Instant Answers
      const ddqResults = await this.fetchDuckDuckGo(query);
      results.push(...ddqResults);
    } catch (e) {
      // Silent fail
    }

    // Sort by relevance and deduplicate
    const unique = new Map<string, WebResult>();
    for (const r of results) {
      const key = r.title.toLowerCase();
      if (!unique.has(key) || unique.get(key)!.relevance < r.relevance) {
        unique.set(key, r);
      }
    }

    const sorted = Array.from(unique.values())
      .filter(r => r.relevance > 20) // Minimum relevance threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);

    // Cache
    this.cache.set(query, { results: sorted, timestamp: Date.now() });

    return sorted;
  }

  private async fetchWikipediaDirect(query: string): Promise<WebResult | null> {
    const normalized = query.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const response = await fetch(`${WIKIPEDIA_API}/${normalized}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.type === 'disambiguation') return null;

    const extract = decodeHtmlEntities(data.extract || '');
    const title = decodeHtmlEntities(data.title || '');

    const relevance = calculateRelevance(query, title, extract);
    if (relevance < 20) return null;

    return {
      title,
      extract,
      source: 'Wikipedia',
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${normalized}`,
      relevance
    };
  }

  private async fetchWikipediaSearch(query: string): Promise<WebResult[]> {
    const url = `${WIKIPEDIA_SEARCH}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
    const response = await fetch(url);

    if (!response.ok) return [];

    const data = await response.json();
    const results: WebResult[] = [];

    for (const item of data.query?.search || []) {
      const title = decodeHtmlEntities(item.title || '');
      const snippet = decodeHtmlEntities(item.snippet || '');

      // Fetch full extract for better relevance
      let extract = snippet;
      try {
        const pageResponse = await fetch(`${WIKIPEDIA_API}/${encodeURIComponent(item.title)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          extract = decodeHtmlEntities(pageData.extract || snippet);
        }
      } catch (e) {
        // Use snippet
      }

      const relevance = calculateRelevance(query, title, extract);
      if (relevance < 20) continue;

      results.push({
        title,
        extract,
        source: 'Wikipedia',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        relevance
      });
    }

    return results;
  }

  private async fetchDuckDuckGo(query: string): Promise<WebResult[]> {
    const url = `${DUCKDUCKGO_API}/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url);

    if (!response.ok) return [];

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      return [];
    }

    const results: WebResult[] = [];

    if (data.AbstractText) {
      const extract = decodeHtmlEntities(data.AbstractText);
      const title = decodeHtmlEntities(data.Heading || query);
      const relevance = calculateRelevance(query, title, extract);

      if (relevance >= 20) {
        results.push({
          title,
          extract,
          source: 'DuckDuckGo',
          url: data.AbstractURL || '',
          relevance
        });
      }
    }

    // Related topics
    for (const topic of data.RelatedTopics || []) {
      if (topic.Text) {
        const extract = decodeHtmlEntities(topic.Text);
        const title = decodeHtmlEntities(topic.FirstURL?.split('/').pop() || query);
        const relevance = calculateRelevance(query, title, extract);

        if (relevance >= 20) {
          results.push({
            title,
            extract,
            source: 'DuckDuckGo',
            url: topic.FirstURL || '',
            relevance
          });
        }
      }
    }

    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const browserTool = new BrowserTool();
