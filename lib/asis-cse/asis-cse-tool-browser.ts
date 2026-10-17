// @ts-nocheck
/**
 * ASIS CSE — Real-Time Browser & Search Tool
 * Provides live internet search (via Serper/Tavily) and secure web page fetching.
 * Wires into ObservationEngine with strict risk classification.
 */

import { BaseCognitiveTool, ToolExecutionRequest, ToolExecutionResult } from './asis-cse-tool-types';

export class BrowserTool extends BaseCognitiveTool {
  readonly name = 'browser';
  readonly description = 'Performs real-time web searches and securely fetches live webpage content for cognitive observation.';
  readonly version = '3.0.0';
  readonly requiresNetwork = true;
  readonly requiresFilesystem = false;
  readonly sandboxed = true;

  readonly capabilities = [
    {
      name: 'search',
      description: 'Perform a real-time web search to get live, up-to-date information, news, or facts.',
      parameters: [
        { name: 'query', type: 'string', description: 'The search query', required: true },
        { name: 'maxResults', type: 'number', description: 'Maximum number of results to return', required: false, default: 5 },
      ],
      returns: { type: 'object', description: 'Array of live search results with titles, snippets, and links' },
      defaultRiskLevel: 'SAFE',
    },
    {
      name: 'fetch',
      description: 'Fetch and extract the main text content from a specific live URL.',
      parameters: [
        { name: 'url', type: 'string', description: 'The absolute URL to fetch', required: true },
        { name: 'timeoutMs', type: 'number', description: 'Request timeout in ms', required: false, default: 10000 },
      ],
      returns: { type: 'object', description: 'Extracted text content, title, and metadata from the URL' },
      defaultRiskLevel: 'MONITOR',
    }
  ];

  readonly permissions = [
    { action: 'search', level: 'read', requiresApproval: false, auditLog: true, riskLevel: 'SAFE' },
    { action: 'fetch', level: 'read', requiresApproval: false, auditLog: true, riskLevel: 'MONITOR' },
  ];

  isAvailable(): boolean | Promise<boolean> {
    // Check if a search API key is configured in the environment
    return !!(Deno.env.get('SERPER_API_KEY') || Deno.env.get('TAVILY_API_KEY'));
  }

  async execute(request: ToolExecutionRequest): Promise<Omit<ToolExecutionResult, 'status' | 'executionTimeMs' | 'metadata'>> {
    const { capability, parameters } = request;

    try {
      if (capability === 'search') {
        return await this.executeSearch(parameters.query, parameters.maxResults || 5);
      } else if (capability === 'fetch') {
        return await this.executeFetch(parameters.url, parameters.timeoutMs || 10000);
      } else {
        throw new Error(`Unknown capability: ${capability}`);
      }
    } catch (error: any) {
      return { error: error.message, data: null };
    }
  }

  getHealth(): { healthy: boolean; score: number; lastError?: string } {
    const hasKey = !!(Deno.env.get('SERPER_API_KEY') || Deno.env.get('TAVILY_API_KEY'));
    return { healthy: hasKey, score: hasKey ? 1.0 : 0.0, lastError: hasKey ? undefined : 'Missing SEARCH_API_KEY in environment' };
  }

  // ============================================================
  // REAL-TIME SEARCH IMPLEMENTATION
  // ============================================================
  private async executeSearch(query: string, maxResults: number) {
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const tavilyKey = Deno.env.get('TAVILY_API_KEY');

    if (!serperKey && !tavilyKey) {
      throw new Error('Real-time search is unavailable: Missing SERPER_API_KEY or TAVILY_API_KEY in Edge Function secrets.');
    }

    let results: any[] = [];

    if (serperKey) {
      // Use Serper.dev (Real Google Search Results)
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: maxResults }),
      });

      if (!response.ok) throw new Error(`Serper API error: ${response.status}`);
      const data = await response.json();
      
      results = (data.organic || []).map((item: any, idx: number) => ({
        rank: idx + 1,
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'Google Search (Serper)',
      })).slice(0, maxResults);

    } else if (tavilyKey) {
      // Use Tavily (AI-Optimized Web Search)
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tavilyKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, max_results: maxResults, search_depth: 'basic' }),
      });

      if (!response.ok) throw new Error(`Tavily API error: ${response.status}`);
      const data = await response.json();
      
      results = (data.results || []).map((item: any, idx: number) => ({
        rank: idx + 1,
        title: item.title,
        url: item.url,
        snippet: item.content,
        source: 'Tavily AI Search',
      }));
    }

    return {
      data: { query, resultCount: results.length, results },
      error: null,
    };
    }

  // ============================================================
  // SECURE WEB PAGE FETCHING IMPLEMENTATION
  // ============================================================
  private async executeFetch(url: string, timeoutMs: number) {
    // 1. URL Validation (Prevent SSRF to internal networks)
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol: Only http and https are allowed.');
    }
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname.startsWith('127.') || parsedUrl.hostname.startsWith('10.') || parsedUrl.hostname.startsWith('192.168.')) {
      throw new Error('Access to internal networks is blocked.');
    }

    // 2. Fetch with Timeout and Bot-Headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'MTAA-ASIS-Bot/1.0 (Educational AI Crawler)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // 3. Basic HTML Stripping to extract readable text (prevents token overflow)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')    // Remove styles
        .replace(/<[^>]+>/g, ' ')                                           // Remove remaining tags
        .replace(/\s+/g, ' ')                                               // Normalize whitespace
        .trim()
        .substring(0, 8000); // Limit to 8000 chars to prevent LLM context overflow

      // 4. Extract basic metadata
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled Page';

      return {
        data: {
          url: parsedUrl.href,
          title,
          contentType: response.headers.get('content-type'),
          textContent,
          fetchedAt: new Date().toISOString(),
        },
        error: null,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
