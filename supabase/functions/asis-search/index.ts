import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  type?: 'web' | 'images' | 'news' | 'videos';
  limit?: number;
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  thumbnail?: string;
  publishedDate?: string;
}

// SerpAPI search (most reliable, requires API key)
async function searchSerpAPI(query: string, type: string = 'web', limit: number = 5): Promise<SearchResult[]> {
  const apiKey = Deno.env.get('SERPAPI_KEY');
  if (!apiKey) {
    console.warn('SERPAPI_KEY not set, falling back to DuckDuckGo');
    return searchDuckDuckGo(query, type, limit);
  }

  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: String(Math.min(limit, 10)),
  });

  if (type === 'images') params.set('tbm', 'isch');
  if (type === 'news') params.set('tbm', 'nws');
  if (type === 'videos') params.set('tbm', 'vid');

  const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
  if (!response.ok) throw new Error(`SerpAPI error: ${response.status}`);

  const data = await response.json();
  const results: SearchResult[] = [];

  for (const r of data.organic_results || []) {
    results.push({
      title: r.title || '',
      snippet: r.snippet || r.description || '',
      url: r.link || r.url || '',
      source: 'Google',
      thumbnail: r.thumbnail,
      publishedDate: r.date,
    });
  }

  if (data.knowledge_graph?.description) {
    results.unshift({
      title: data.knowledge_graph.title || query,
      snippet: data.knowledge_graph.description,
      url: data.knowledge_graph.website || `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      source: 'Knowledge Graph',
    });
  }

  if (data.answer_box?.answer) {
    results.unshift({
      title: 'Direct Answer',
      snippet: data.answer_box.answer,
      url: data.answer_box.link || '',
      source: 'Google Answer',
    });
  }

  return results.slice(0, limit);
}

// DuckDuckGo fallback (no API key needed)
async function searchDuckDuckGo(query: string, type: string = 'web', limit: number = 5): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`DDG error: ${response.status}`);

  const text = await response.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch (e) { return []; }

  const results: SearchResult[] = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading || query,
      snippet: data.AbstractText,
      url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      source: 'DuckDuckGo',
      thumbnail: data.Image,
    });
  }

  for (const topic of data.RelatedTopics?.slice(0, limit) || []) {
    if (topic.Text) {
      results.push({
        title: topic.FirstURL?.split('/').pop() || 'Related',
        snippet: topic.Text,
        url: topic.FirstURL || '',
        source: 'DuckDuckGo',
      });
    }
  }

  return results;
}

// Wikipedia summary
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
    const response = await fetch(searchUrl);
    if (!response.ok) return [];

    const data = await response.json();
    const results: SearchResult[] = [];

    for (const item of data.query?.search || []) {
      const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`;
      const pageRes = await fetch(pageUrl);
      let extract = item.snippet.replace(/<[^>]+>/g, '');
      let thumbnail: string | undefined;

      if (pageRes.ok) {
        const pageData = await pageRes.json();
        if (pageData.extract) extract = pageData.extract;
        if (pageData.thumbnail?.source) thumbnail = pageData.thumbnail.source;
      }

      results.push({
        title: item.title,
        snippet: extract,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
        source: 'Wikipedia',
        thumbnail,
      });
    }

    return results;
  } catch (e) {
    return [];
  }
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, type = 'web', limit = 5 }: SearchRequest = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Run searches in parallel
    const [serpResults, wikiResults] = await Promise.all([
      searchSerpAPI(query, type, limit).catch(() => []),
      searchWikipedia(query).catch(() => []),
    ]);

    // Combine and deduplicate
    const allResults = [...serpResults, ...wikiResults];
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const r of allResults) {
      const key = r.title.toLowerCase().slice(0, 40);
      if (!seen.has(key) && r.snippet.length > 10) {
        seen.add(key);
        unique.push(r);
      }
    }

    // Build synthesized answer
    const answer = buildAnswer(query, unique);

    return new Response(
      JSON.stringify({
        query,
        answer,
        results: unique.slice(0, limit),
        images: unique.map((r: any) => r.thumbnail).filter(Boolean).slice(0, 5),
        relatedQuestions: generateRelated(query, unique),
        sources: [...new Set(unique.map((r: any) => r.source))],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAnswer(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return `I couldn't find information about "${query}". Try rephrasing or check your spelling.`;
  }

  const best = results[0];
  const q = query.toLowerCase();

  if (q.includes('who') || q.includes('what is') || q.includes('what are')) {
    return `${best.snippet}

Source: ${best.source}`;
  }

  if (q.includes('how to') || q.includes('how do')) {
    const steps = results.slice(0, 3).map((r, i) => `${i + 1}. ${r.title}: ${r.snippet.slice(0, 100)}...`).join('\n');
    return `Here's how:\n\n${steps}\n\nSources: ${[...new Set(results.slice(0, 3).map((r: any) => r.source))].join(', ')}`;
  }

  let answer = best.snippet;
  if (results.length > 1) {
    answer += `\n\nMore info: ${results[1].snippet.slice(0, 120)}...`;
  }
  answer += `\n\nSource: ${best.title} (${best.source})`;

  return answer;
}

function generateRelated(query: string, results: SearchResult[]): string[] {
  const related: string[] = [];
  const q = query.toLowerCase();

  if (q.includes('world cup')) {
    related.push('When is the next FIFA World Cup?');
    related.push('Which country has won the most World Cups?');
  }
  if (q.includes('einstein') || q.includes('relativity')) {
    related.push('What is the theory of relativity?');
    related.push('Who are other famous physicists?');
  }
  if (q.includes('ant')) {
    related.push('How do ants communicate?');
    related.push('What is the largest ant species?');
  }

  for (const r of results.slice(0, 2)) {
    if (r.title.length > 5 && r.title.length < 50) {
      related.push(`Tell me more about ${r.title}`);
    }
  }

  return [...new Set(related)].slice(0, 3);
}
