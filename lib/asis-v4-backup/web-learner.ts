/**
 * ASIS v4 Web Learner
 * Autonomous web crawler — fetches, parses, learns
 */

export interface WebPageContent {
  url: string;
  title: string;
  summary: string;
  keyFacts: string[];
  links: string[];
  timestamp: number;
}

export class WebLearner {
  private cache: Map<string, WebPageContent> = new Map();
  private maxCacheSize = 50;
  private allowedDomains = new Set<string>();

  constructor() {
    // Pre-allowed educational domains
    const domains = [
      'wikipedia.org', 'arxiv.org', 'github.com',
      'mdn.mozilla.org', 'docs.python.org', 'docs.expo.dev',
      'reactnative.dev', 'supabase.com', 'postgresql.org',
    ];
    domains.forEach(d => this.allowedDomains.add(d));
  }

  async learnFromUrl(url: string): Promise<WebPageContent | null> {
    // Check cache
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Validate domain
    try {
      const domain = new URL(url).hostname;
      if (!this.isAllowed(domain)) {
        return {
          url,
          title: 'Domain Not Allowed',
          summary: `I can only fetch from pre-approved educational domains. ${domain} is not on the allowlist.`,
          keyFacts: [],
          links: [],
          timestamp: Date.now(),
        };
      }
    } catch {
      return null;
    }

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html' },
      });
      const html = await response.text();
      const content = this.parseHtml(url, html);

      // Cache
      this.cache.set(url, content);
      if (this.cache.size > this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return content;
    } catch (error) {
      return {
        url,
        title: 'Fetch Error',
        summary: `Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        keyFacts: [],
        links: [],
        timestamp: Date.now(),
      };
    }
  }

  private isAllowed(domain: string): boolean {
    for (const allowed of this.allowedDomains) {
      if (domain === allowed || domain.endsWith('.' + allowed)) {
        return true;
      }
    }
    return false;
  }

  private parseHtml(url: string, html: string): WebPageContent {
    // Strip tags
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Extract links
    const links: string[] = [];
    const linkMatches = html.matchAll(/href="(https?:\/\/[^"]+)"/g);
    const linkArray = Array.from(linkMatches);
    for (let i = 0; i < Math.min(10, linkArray.length); i++) {
      links.push(linkArray[i][1]);
    }

    // Extract key facts (sentences with numbers or definitions)
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    const keyFacts = sentences
      .filter(s => /\d/.test(s) || s.includes('is') || s.includes('are'))
      .slice(0, 5);

    // Summary: first 3 substantial sentences
    const summary = sentences.slice(0, 3).join('. ') + '.';

    return {
      url,
      title,
      summary: summary.length > 500 ? summary.slice(0, 500) + '...' : summary,
      keyFacts,
      links,
      timestamp: Date.now(),
    };
  }

  addAllowedDomain(domain: string) {
    this.allowedDomains.add(domain);
  }

  getCache(): WebPageContent[] {
    return Array.from(this.cache.values());
  }

  clearCache() {
    this.cache.clear();
  }
}

export const webLearner = new WebLearner();
