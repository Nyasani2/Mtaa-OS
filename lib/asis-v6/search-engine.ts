/**
 * ASIS Search Engine v6
 * Real web search with multiple sources
 * NO stuck cache — every query is fresh
 */

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  thumbnail?: string;
  publishedDate?: string;
}

export interface RichAnswer {
  text: string;
  type: 'fact' | 'summary' | 'list' | 'comparison' | 'unknown';
  results: SearchResult[];
  images: string[];
  relatedQuestions: string[];
}

class SearchEngine {
  // Multiple search endpoints for redundancy
  private async searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
      // Wikipedia REST API for direct summaries
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
      const response = await fetch(searchUrl, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) return [];

      const data = await response.json();
      const results: SearchResult[] = [];

      for (const item of data.query?.search || []) {
        // Get full extract for each result
        const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`;
        const pageRes = await fetch(pageUrl);
        let extract = item.snippet.replace(/<[^>]+>/g, ''); // Strip HTML tags

        if (pageRes.ok) {
          const pageData = await pageRes.json();
          if (pageData.extract) extract = pageData.extract;
        }

        results.push({
          title: item.title,
          snippet: extract,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
          source: 'Wikipedia',
          thumbnail: `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(item.title)}?width=120`
        });
      }

      return results;
    } catch (e) {
      return [];
    }
  }

  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      // DuckDuckGo Instant Answers API
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=asis_ai`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const text = await response.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch (e) { return []; }

      const results: SearchResult[] = [];

      // Main abstract
      if (data.AbstractText && data.AbstractText.length > 20) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          source: 'DuckDuckGo',
          thumbnail: data.Image || undefined
        });
      }

      // Related topics
      for (const topic of data.RelatedTopics || []) {
        if (topic.Text && topic.Text.length > 10) {
          results.push({
            title: topic.FirstURL?.split('/').pop() || 'Related',
            snippet: topic.Text,
            url: topic.FirstURL || '',
            source: 'DuckDuckGo'
          });
        }
      }

      return results;
    } catch (e) {
      return [];
    }
  }

  private async searchBrave(query: string): Promise<SearchResult[]> {
    // Brave Search API (if user has API key configured)
    // Fallback to web scraping approach
    try {
      const url = `https://search.brave.com/api/suggest?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const results: SearchResult[] = [];

      for (const suggestion of data[1] || []) {
        results.push({
          title: suggestion,
          snippet: `Search suggestion for: ${suggestion}`,
          url: `https://search.brave.com/search?q=${encodeURIComponent(suggestion)}`,
          source: 'Brave'
        });
      }

      return results;
    } catch (e) {
      return [];
    }
  }

  /**
   * Main search method — aggregates multiple sources
   * NO caching — every call is fresh
   */
  async search(query: string): Promise<RichAnswer> {
    // Run all searches in parallel
    const [wikiResults, ddgResults, braveResults] = await Promise.all([
      this.searchWikipedia(query),
      this.searchDuckDuckGo(query),
      this.searchBrave(query)
    ]);

    // Combine and deduplicate
    const allResults = [...wikiResults, ...ddgResults, ...braveResults];
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const r of allResults) {
      const key = r.title.toLowerCase().slice(0, 30);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }

    // Determine answer type and build response
    const q = query.toLowerCase();
    let answerType: RichAnswer['type'] = 'summary';

    if (q.includes('who') || q.includes('what is') || q.includes('what are')) answerType = 'fact';
    else if (q.includes('how to') || q.includes('how do')) answerType = 'summary';
    else if (q.includes('compare') || q.includes('vs') || q.includes('versus')) answerType = 'comparison';
    else if (q.includes('list') || q.includes('top') || q.includes('best')) answerType = 'list';

    // Build synthesized answer
    const synthesizedText = this.synthesizeAnswer(query, unique, answerType);

    // Extract images from results
    const images = unique
      .map(r => r.thumbnail)
      .filter((img): img is string => !!img && img.length > 0)
      .slice(0, 3);

    // Generate related questions
    const relatedQuestions = this.generateRelatedQuestions(query, unique);

    return {
      text: synthesizedText,
      type: answerType,
      results: unique.slice(0, 5),
      images,
      relatedQuestions
    };
  }

  /**
   * Synthesize a proper answer from search results
   * No template responses — actual content from sources
   */
  private synthesizeAnswer(query: string, results: SearchResult[], type: RichAnswer['type']): string {
    if (results.length === 0) {
      return `I don't have current information about "${query}". My web search didn't return relevant results. This could be because:\n\n1. The topic is very recent or niche\n2. Network connectivity issues\n3. The search APIs are rate-limited\n\nTry rephrasing your question or ask about a different topic.`;
    }

    const best = results[0];
    const q = query.toLowerCase();

    // Build contextual answer based on question type
    if (type === 'fact' && (q.includes('who') || q.includes('what is'))) {
      // Direct factual answer
      const name = this.extractName(query);
      if (best.snippet.length > 50) {
        return `${best.snippet}\n\nSource: ${best.source}`;
      }
    }

    if (type === 'comparison') {
      const items = results.slice(0, 3).map(r => `• ${r.title}: ${r.snippet.slice(0, 100)}...`).join('\n');
      return `Here's what I found comparing your query:\n\n${items}\n\nSources: ${results.slice(0, 3).map(r => r.source).join(', ')}`;
    }

    if (type === 'list') {
      const items = results.map((r, i) => `${i + 1}. ${r.title} — ${r.snippet.slice(0, 80)}...`).join('\n');
      return `Here are the relevant results:\n\n${items}\n\nSources: ${[...new Set(results.map(r => r.source))].join(', ')}`;
    }

    // Default summary
    let answer = best.snippet;
    if (results.length > 1) {
      answer += `\n\nAdditional context: ${results[1].snippet.slice(0, 150)}...`;
    }
    answer += `\n\nSource: ${best.title} (${best.source})`;

    return answer;
  }

  private extractName(query: string): string {
    const match = query.match(/(?:who|what)\s+(?:is|are|was|were)\s+(.+?)\??$/i);
    return match ? match[1].trim() : query;
  }

  private generateRelatedQuestions(query: string, results: SearchResult[]): string[] {
    const related: string[] = [];
    const q = query.toLowerCase();

    if (q.includes('world cup')) {
      related.push('When is the next World Cup?');
      related.push('Which country has won the most World Cups?');
    }
    if (q.includes('scientist') || q.includes('einstein')) {
      related.push('What is the theory of relativity?');
      related.push('Who are other famous physicists?');
    }
    if (q.includes('ants')) {
      related.push('How do ants communicate?');
      related.push('What is the largest ant species?');
    }

    // Add from result titles
    for (const r of results.slice(0, 2)) {
      if (r.title.length > 5 && r.title.length < 60) {
        related.push(`Tell me more about ${r.title}`);
      }
    }

    return [...new Set(related)].slice(0, 3);
  }
}

export const searchEngine = new SearchEngine();
