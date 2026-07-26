/**
 * ASIS CSE — Browser Tool
 * Web perception for the cognitive architecture
 * Fetches pages, extracts content, follows links, captures metadata
 * Wires into ObservationEngine
 */

import { BaseCognitiveTool, ToolExecutionRequest } from './asis-cse-tool-types';

interface BrowserFetchOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  extractLinks?: boolean;
  extractImages?: boolean;
  extractMetadata?: boolean;
}

interface BrowserFetchResult {
  url: string;
  finalUrl: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  contentType: string;
  contentLength: number;
  body: string;
  textContent: string;
  title?: string;
  description?: string;
  links?: Array<{ href: string; text: string; isExternal: boolean }>;
  images?: Array<{ src: string; alt: string }>;
  metadata?: Record<string, string>;
  fetchTimeMs: number;
  redirectCount: number;
}

interface BrowserSearchOptions {
  query: string;
  maxResults?: number;
  safeSearch?: boolean;
}

interface BrowserSearchResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
  }>;
  resultCount: number;
  searchTimeMs: number;
}

export class BrowserTool extends BaseCognitiveTool {
  readonly name = 'browser';
  readonly description = 'Fetches web pages, extracts content, searches the internet, and captures metadata for cognitive observation';
  readonly version = '2.0.0';
  readonly requiresNetwork = true;
  readonly requiresFilesystem = false;
  readonly sandboxed = true;

  readonly capabilities = [
    {
      name: 'fetch',
      description: 'Fetch a web page and extract its content',
      parameters: [
        { name: 'url', type: 'string', description: 'URL to fetch', required: true },
        { name: 'method', type: 'string', description: 'HTTP method', required: false, default: 'GET', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
        { name: 'headers', type: 'object', description: 'Custom HTTP headers', required: false },
        { name: 'body', type: 'string', description: 'Request body for POST/PUT', required: false },
        { name: 'timeoutMs', type: 'number', description: 'Request timeout in ms', required: false, default: 15000 },
        { name: 'followRedirects', type: 'boolean', description: 'Follow HTTP redirects', required: false, default: true },
        { name: 'maxRedirects', type: 'number', description: 'Max redirects to follow', required: false, default: 5 },
        { name: 'extractLinks', type: 'boolean', description: 'Extract all links from page', required: false, default: true },
        { name: 'extractImages', type: 'boolean', description: 'Extract image references', required: false, default: false },
        { name: 'extractMetadata', type: 'boolean', description: 'Extract meta tags', required: false, default: true },
      ],
      returns: { type: 'object', description: 'BrowserFetchResult with content, metadata, and extracted elements' },
    },
    {
      name: 'search',
      description: 'Search the web for information',
      parameters: [
        { name: 'query', type: 'string', description: 'Search query', required: true },
        { name: 'maxResults', type: 'number', description: 'Maximum results to return', required: false, default: 5 },
        { name: 'safeSearch', type: 'boolean', description: 'Enable safe search filtering', required: false, default: true },
      ],
      returns: { type: 'object', description: 'BrowserSearchResult with ranked results' },
    },
    {
      name: 'summarize',
      description: 'Summarize fetched web content',
      parameters: [
        { name: 'content', type: 'string', description: 'HTML or text content to summarize', required: true },
        { name: 'maxLength', type: 'number', description: 'Max summary length in characters', required: false, default: 500 },
        { name: 'format', type: 'string', description: 'Summary format', required: false, default: 'paragraph', enum: ['paragraph', 'bullet', 'key_points'] },
      ],
      returns: { type: 'string', description: 'Summarized content' },
    },
  ];

  readonly permissions = [
    { action: 'fetch', level: 'read', requiresApproval: false, auditLog: true },
    { action: 'search', level: 'read', requiresApproval: false, auditLog: true },
    { action: 'summarize', level: 'read', requiresApproval: false, auditLog: false },
  ];

  private blockedHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]',
    '169.254',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
  ];

  isAvailable(): boolean {
    return typeof fetch !== 'undefined';
  }

  async doExecute(request: ToolExecutionRequest): Promise<any> {
    switch (request.capability) {
      case 'fetch':
        return this.fetchPage(request.parameters as BrowserFetchOptions);
      case 'search':
        return this.searchWeb(request.parameters as BrowserSearchOptions);
      case 'summarize':
        return this.summarizeContent(
          request.parameters.content,
          request.parameters.maxLength,
          request.parameters.format
        );
      default:
        throw new Error(`Unknown capability: ${request.capability}`);
    }
  }

  private async fetchPage(options: BrowserFetchOptions): Promise<BrowserFetchResult> {
    const url = options.url;
    if (!this.isUrlAllowed(url)) {
      throw new Error(`URL blocked for security: ${url}`);
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || { 'User-Agent': 'ASIS-CSE/2.0 BrowserTool' },
        body: options.body,
        signal: controller.signal,
        redirect: options.followRedirects !== false ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);

      const body = await response.text();
      const fetchTimeMs = Date.now() - startTime;

      const result: BrowserFetchResult = {
        url,
        finalUrl: response.url,
        status: response.status,
        statusText: response.statusText,
        headers: this.headersToRecord(response.headers),
        contentType: response.headers.get('content-type') || 'unknown',
        contentLength: body.length,
        body: body.slice(0, 50000), // Limit body size
        textContent: this.extractText(body),
        fetchTimeMs,
        redirectCount: 0,
      };

      if (options.extractMetadata !== false) {
        result.metadata = this.extractMetadata(body);
        result.title = result.metadata['og:title'] || result.metadata['title'] || this.extractTitle(body);
        result.description = result.metadata['og:description'] || result.metadata['description'];
      }

      if (options.extractLinks) {
        result.links = this.extractLinks(body, url);
      }

      if (options.extractImages) {
        result.images = this.extractImages(body, url);
      }

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(`Fetch failed: ${err.message}`);
    }
  }

  private async searchWeb(options: BrowserSearchOptions): Promise<BrowserSearchResult> {
    // Use DuckDuckGo HTML endpoint (no API key required)
    const query = encodeURIComponent(options.query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;

    const startTime = Date.now();
    const fetchResult = await this.fetchPage({
      url: searchUrl,
      timeoutMs: 10000,
      extractLinks: false,
      extractMetadata: false,
    });

    const results = this.parseSearchResults(fetchResult.body, options.maxResults || 5);

    return {
      query: options.query,
      results,
      resultCount: results.length,
      searchTimeMs: Date.now() - startTime,
    };
  }

  private summarizeContent(content: string, maxLength = 500, format: string = 'paragraph'): string {
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);

    if (sentences.length === 0) return text.slice(0, maxLength);

    // Simple extractive summarization: first sentence + key sentences
    const keySentences = [sentences[0]];
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: Record<string, number> = {};
    words.forEach((w) => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

    const scored = sentences.slice(1).map((s) => ({
      sentence: s,
      score: s.split(/\s+/).reduce((sum, w) => sum + (wordFreq[w.toLowerCase()] || 0), 0) / s.split(/\s+/).length,
    }));

    scored.sort((a, b) => b.score - a.score);
    const topSentences = scored.slice(0, 3).map((s) => s.sentence.trim());

    if (format === 'bullet') {
      return topSentences.map((s) => `• ${s}`).join('\n').slice(0, maxLength);
    } else if (format === 'key_points') {
      return topSentences.map((s, i) => `${i + 1}. ${s}`).join('\n').slice(0, maxLength);
    }

    return [...keySentences, ...topSentences].join('. ').slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  private isUrlAllowed(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      return !this.blockedHosts.some((blocked) => hostname === blocked || hostname.startsWith(blocked));
    } catch {
      return false;
    }
  }

  private headersToRecord(headers: Headers): Record<string, string> {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => { record[key] = value; });
    return record;
  }

  private extractText(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);
  }

  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim() : undefined;
  }

  private extractMetadata(html: string): Record<string, string> {
    const meta: Record<string, string> = {};
    const title = this.extractTitle(html);
    if (title) meta['title'] = title;

    const metaRegex = /<meta\s+([^>]*)>/gi;
    let m;
    while ((m = metaRegex.exec(html)) !== null) {
      const attrs = m[1];
      const nameMatch = attrs.match(/(?:name|property)=["']([^"']+)["']/i);
      const contentMatch = attrs.match(/content=["']([^"']*)["']/i);
      if (nameMatch && contentMatch) {
        meta[nameMatch[1]] = contentMatch[1];
      }
    }
    return meta;
  }

  private extractLinks(html: string, baseUrl: string): Array<{ href: string; text: string; isExternal: boolean }> {
    const links: Array<{ href: string; text: string; isExternal: boolean }> = [];
    const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      try {
        const href = new URL(m[1], baseUrl).href;
        const isExternal = !href.startsWith(baseUrl);
        links.push({ href, text: m[2].trim(), isExternal });
      } catch { /* ignore invalid URLs */ }
    }
    return links.slice(0, 50);
  }

  private extractImages(html: string, baseUrl: string): Array<{ src: string; alt: string }> {
    const images: Array<{ src: string; alt: string }> = [];
    const regex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      try {
        const src = new URL(m[1], baseUrl).href;
        const altMatch = m[0].match(/alt=["']([^"']*)["']/i);
        images.push({ src, alt: altMatch ? altMatch[1] : '' });
      } catch { /* ignore invalid URLs */ }
    }
    return images.slice(0, 20);
  }

  private parseSearchResults(html: string, maxResults: number): Array<{ title: string; url: string; snippet: string; source: string }> {
    const results: Array<{ title: string; url: string; snippet: string; source: string }> = [];
    // DuckDuckGo HTML result parsing
    const resultRegex = /<a\s+[^>]*class="result__a"[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    const snippetRegex = /<a\s+class="result__snippet"[^>]*>([^<]*)<\/a>/gi;

    let titleMatch;
    const titles: Array<{ url: string; title: string }> = [];
    while ((titleMatch = resultRegex.exec(html)) !== null) {
      titles.push({ url: titleMatch[1], title: titleMatch[2].trim() });
    }

    let snippetMatch;
    const snippets: string[] = [];
    while ((snippetMatch = snippetRegex.exec(html)) !== null) {
      snippets.push(snippetMatch[1].trim());
    }

    for (let i = 0; i < Math.min(titles.length, snippets.length, maxResults); i++) {
      results.push({
        title: titles[i].title,
        url: titles[i].url,
        snippet: snippets[i],
        source: 'DuckDuckGo',
      });
    }

    return results;
  }
}
