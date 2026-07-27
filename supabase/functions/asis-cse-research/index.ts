import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface Evidence {
  source: string;
  url: string;
  title: string;
  snippet: string;
  extracted_text: string;
  reliability_score: number;
  timestamp: string;
}

// ─── DuckDuckGo HTML Search (no API key) ────────────────────
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const results: SearchResult[] = [];

    // Parse DDG HTML results
    const resultBlocks = html.match(/<div class="result[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g) || [];

    for (const block of resultBlocks.slice(0, 8)) {
      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      const urlMatch = block.match(/<a[^>]*href="([^"]*?)"/);
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch && urlMatch) {
        const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        const rawUrl = urlMatch[1];
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // DDG uses redirect URLs — extract real URL
        const realUrl = rawUrl.includes('/l/?')
          ? decodeURIComponent(rawUrl.match(/uddg=([^&]+)/)?.[1] || rawUrl)
          : rawUrl;

        if (title && realUrl && !realUrl.includes('duckduckgo.com')) {
          results.push({ title, url: realUrl, snippet, source: 'DuckDuckGo' });
        }
      }
    }

    return results;
  } catch (e) {
    console.error('[DDG Search] error:', e);
    return [];
  }
}

// ─── Wikipedia API (structured, not summary) ────────────────
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const res = await fetch(searchUrl);
    if (!res.ok) return [];

    const data = await res.json();
    const results: SearchResult[] = [];

    for (const item of (data.query?.search || []).slice(0, 3)) {
      const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`;
      results.push({
        title: item.title,
        url: pageUrl,
        snippet: item.snippet.replace(/<[^>]+>/g, ''),
        source: 'Wikipedia',
      });
    }

    return results;
  } catch (e) {
    console.error('[Wikipedia Search] error:', e);
    return [];
  }
}

// ─── Wikidata API (structured facts) ────────────────────────
async function searchWikidata(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const results: SearchResult[] = [];

    for (const item of (data.search || []).slice(0, 3)) {
      results.push({
        title: item.label || item.id,
        url: `https://www.wikidata.org/wiki/${item.id}`,
        snippet: item.description || '',
        source: 'Wikidata',
      });
    }

    return results;
  } catch (e) {
    console.error('[Wikidata Search] error:', e);
    return [];
  }
}

// ─── Content Extraction (lightweight) ───────────────────────
async function extractContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      // Edge function timeout is 60s, keep fetch short
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return '';
    const html = await res.text();

    // Extract meta description
    const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] || '';
    const metaOgDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] || '';

    // Extract first meaningful paragraphs
    const paragraphs = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];

    const textChunks = paragraphs
      .map((p: string) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((t: string) => t.length > 40 && t.length < 800)
      .slice(0, 5);

    const combined = [metaDesc || metaOgDesc, ...textChunks].filter(Boolean).join(' ');
    return combined.slice(0, 3000);
  } catch (e) {
    console.warn('[Content Extract] failed for', url, e);
    return '';
  }
}

// ─── Reliability Scoring ────────────────────────────────────
function scoreReliability(source: string, url: string): number {
  const trustedDomains = [
    'wikipedia.org', 'wikidata.org', 'britannica.com',
    'nature.com', 'science.org', 'who.int', 'un.org',
    'worldbank.org', 'reuters.com', 'apnews.com',
    'bbc.com', 'nytimes.com', 'theguardian.com',
    'github.com', 'stackoverflow.com',
  ];

  const domain = new URL(url).hostname.replace('www.', '');

  if (trustedDomains.some((d) => domain.includes(d))) return 0.9;
  if (domain.includes('.edu') || domain.includes('.gov') || domain.includes('.ac.')) return 0.85;
  if (domain.includes('medium.com') || domain.includes('dev.to')) return 0.6;
  if (domain.includes('reddit.com') || domain.includes('quora.com')) return 0.4;
  return 0.5;
}

// ─── Main Handler ───────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { query, context = [] } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    console.log('[ASIS CSE Research] query:', query);

    // Parallel multi-source search
    const [ddgResults, wikiResults, wikidataResults] = await Promise.all([
      searchDuckDuckGo(query),
      searchWikipedia(query),
      searchWikidata(query),
    ]);

    // Deduplicate by URL
    const seen = new Set<string>();
    const allResults: SearchResult[] = [];
    for (const r of [...ddgResults, ...wikiResults, ...wikidataResults]) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        allResults.push(r);
      }
    }

    // Take top 5 for content extraction
    const topResults = allResults.slice(0, 5);

    // Extract content from top results (with timeout protection)
    const evidencePromises = topResults.map(async (result) => {
      const extracted = await extractContent(result.url);
      return {
        source: result.source,
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        extracted_text: extracted || result.snippet,
        reliability_score: scoreReliability(result.source, result.url),
        timestamp: new Date().toISOString(),
      };
    });

    const evidence = await Promise.all(evidencePromises);

    // Filter out empty evidence
    const validEvidence = evidence.filter((e) => e.extracted_text.length > 20);

    // Simple extractive synthesis (no LLM)
    const synthesis = synthesizeExtractive(query, validEvidence);

    return new Response(
      JSON.stringify({
        query,
        evidence: validEvidence,
        synthesis,
        sources_count: validEvidence.length,
        processed_at: new Date().toISOString(),
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[ASIS CSE Research] fatal error:', e);
    return new Response(
      JSON.stringify({ error: 'Research failed', details: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Extractive Synthesis (no LLM) ──────────────────────────
function synthesizeExtractive(query: string, evidence: Evidence[]): {
  answer: string;
  confidence: number;
  key_facts: string[];
  sources_cited: string[];
} {
  if (evidence.length === 0) {
    return {
      answer: `I searched multiple sources but could not find reliable information about "${query}". Try rephrasing your question or ask about a specific topic.`,
      confidence: 0,
      key_facts: [],
      sources_cited: [],
    };
  }

  // Sort by reliability
  const sorted = [...evidence].sort((a, b) => b.reliability_score - a.reliability_score);
  const top = sorted[0];

  // Extract key sentences containing query terms
  const queryTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const allText = sorted.map((e) => e.extracted_text).join(' ');
  const sentences = allText.match(/[^.!?]+[.!?]+/g) || [];

  const scoredSentences = sentences
    .map((s) => ({
      text: s.trim(),
      score: queryTerms.filter((t) => s.toLowerCase().includes(t)).length + (s.length > 60 ? 1 : 0),
    }))
    .filter((s) => s.score > 0 && s.text.length > 40 && s.text.length < 300)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const keyFacts = scoredSentences.map((s) => s.text);

  // Build answer from top evidence
  const parts: string[] = [];

  if (top.title && top.snippet) {
    parts.push(`**${top.title}**`);
    parts.push(top.snippet);
  }

  if (keyFacts.length > 0) {
    parts.push('');
    parts.push('**Key Information:**');
    keyFacts.forEach((f, i) => parts.push(`${i + 1}. ${f}`));
  }

  const avgReliability = sorted.reduce((sum, e) => sum + e.reliability_score, 0) / sorted.length;
  const confidence = Math.min(0.95, avgReliability * (0.5 + Math.min(evidence.length, 5) * 0.1));

  return {
    answer: parts.join('\n\n'),
    confidence,
    key_facts: keyFacts,
    sources_cited: sorted.slice(0, 3).map((e) => `*Source: ${e.source}*`),
  };
}
