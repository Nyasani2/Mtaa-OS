// @ts-nocheck
/**
 * ASIS CSE — Web Research Engine v2.1
 * Multi-source: DuckDuckGo Instant Answer + Wikipedia REST API
 * Signature unchanged: researchTopic(query: string) => Promise<ResearchResult>
 * DDG is tried first; if it fails (CORS/network), Wikipedia is the fallback.
 * Both results are aggregated when both succeed.
 */

import { ResearchResult, ResearchSource } from './asis-cse-types';

const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const DUCKDUCKGO_API = 'https://api.duckduckgo.com';

interface DDGResponse {
  Abstract?: string;
  AbstractText?: string;
  AbstractSource?: string;
  Heading?: string;
  Image?: string;
  RelatedTopics?: Array<{
    Text?: string;
    FirstURL?: string;
    Icon?: { URL?: string };
  }>;
  Results?: Array<{
    Text?: string;
    FirstURL?: string;
  }>;
  Entity?: string;
  Type?: string;
}

/**
 * Research a topic using multiple sources (DuckDuckGo + Wikipedia)
 * Returns aggregated research with confidence scoring.
 * Signature is IDENTICAL to the Wikipedia-only version.
 */
export async function researchTopic(query: string): Promise<ResearchResult> {
  const startTime = Date.now();

  // Query both sources in parallel; neither blocks the other
  const [ddgResult, wikiResult] = await Promise.allSettled([
    searchDuckDuckGo(query),
    searchWikipedia(query),
  ]);

  const sources: ResearchSource[] = [];
  let combinedText = '';
  let confidence = 0;

  // ─── DuckDuckGo result ───────────────────────────────────────────────
  if (ddgResult.status === 'fulfilled' && ddgResult.value) {
    sources.push({
      name: 'DuckDuckGo',
      url: `${DUCKDUCKGO_API}/?q=${encodeURIComponent(query)}`,
      reliability: 0.85,
      timestamp: Date.now(),
    });
    combinedText += ddgResult.value.text + '\n\n';
    confidence += ddgResult.value.confidence * 0.5;
  }

  // ─── Wikipedia result ────────────────────────────────────────────────
  if (wikiResult.status === 'fulfilled' && wikiResult.value) {
    sources.push({
      name: 'Wikipedia',
      url: wikiResult.value.url || `${WIKIPEDIA_API}/${encodeURIComponent(query)}`,
      reliability: 0.9,
      timestamp: Date.now(),
    });
    combinedText += wikiResult.value.text;
    confidence += wikiResult.value.confidence * 0.5;
  }

  // ─── Both failed ─────────────────────────────────────────────────────
  if (sources.length === 0) {
    return {
      query,
      text: `No results found for "${query}" from available sources.`,
      sources: [],
      confidence: 0,
      timestamp: Date.now(),
      latencyMs: Date.now() - startTime,
    };
  }

  return {
    query,
    text: combinedText.trim(),
    sources,
    confidence: Math.min(confidence, 0.95),
    timestamp: Date.now(),
    latencyMs: Date.now() - startTime,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// DuckDuckGo Instant Answer
// ═════════════════════════════════════════════════════════════════════════════

async function searchDuckDuckGo(query: string): Promise<{ text: string; confidence: number } | null> {
  try {
    const url = `${DUCKDUCKGO_API}/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1&t=mtaa_os`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.warn(`[DDG] HTTP ${response.status} for query: ${query}`);
      return null;
    }

    const data: DDGResponse = await response.json();

    // DDG returns empty object for no results
    if (!data || (!data.Abstract && !data.AbstractText && !data.RelatedTopics?.length)) {
      return null;
    }

    let text = '';

    if (data.Heading) {
      text += `**${data.Heading}**\n\n`;
    }

    if (data.AbstractText) {
      text += data.AbstractText + '\n\n';
    } else if (data.Abstract) {
      text += data.Abstract + '\n\n';
    }

    // Related topics for depth
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const relevantTopics = data.RelatedTopics
        .filter((t) => t.Text)
        .slice(0, 3)
        .map((t) => `• ${t.Text}`)
        .join('\n');
      if (relevantTopics) {
        text += `Related information:\n${relevantTopics}\n\n`;
      }
    }

    // Direct results if available
    if (data.Results && data.Results.length > 0) {
      const directResults = data.Results
        .filter((r) => r.Text)
        .slice(0, 2)
        .map((r) => `• ${r.Text}`)
        .join('\n');
      if (directResults) {
        text += `Additional results:\n${directResults}\n\n`;
      }
    }

    const hasAbstract = !!(data.AbstractText || data.Abstract);
    const confidence = hasAbstract ? 0.85 : 0.5;

    return { text: text.trim(), confidence };
  } catch (error: any) {
    console.warn('[DDG] Search failed:', error?.message || error);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Wikipedia REST API (unchanged from working version)
// ═════════════════════════════════════════════════════════════════════════════

async function searchWikipedia(query: string): Promise<{ text: string; confidence: number; url?: string } | null> {
  try {
    const response = await fetch(`${WIKIPEDIA_API}/${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return searchWikipediaSearch(query);
      }
      return null;
    }

    const data = await response.json();
    if (!data.extract) return null;

    let text = '';
    if (data.title) text += `**${data.title}**\n\n`;
    text += data.extract;
    if (data.description) text += `\n\n*${data.description}*`;

    return {
      text: text.trim(),
      confidence: 0.9,
      url: data.content_urls?.desktop?.page,
    };
  } catch {
    return null;
  }
}

async function searchWikipediaSearch(query: string): Promise<{ text: string; confidence: number; url?: string } | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(searchUrl);
    if (!response.ok) return null;

    const data = await response.json();
    const results = data.query?.search;
    if (!results || results.length === 0) return null;

    const firstResult = results[0];
    const summaryResponse = await fetch(`${WIKIPEDIA_API}/${encodeURIComponent(firstResult.title)}`, {
      headers: { Accept: 'application/json' },
    });

    if (!summaryResponse.ok) return null;
    const summary = await summaryResponse.json();

    return {
      text: `**${summary.title}**\n\n${summary.extract || firstResult.snippet}`,
      confidence: 0.75,
      url: summary.content_urls?.desktop?.page,
    };
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Utilities (unchanged signatures)
// ═════════════════════════════════════════════════════════════════════════════

export function extractKeyTerms(text: string): string[] {
  const stopWords = new Set([
    'the','a','an','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could',
    'should','may','might','must','shall','can','need','dare',
    'ought','used','to','of','in','for','on','with','at','by',
    'from','as','into','through','during','before','after','above',
    'below','between','under','again','further','then','once','here',
    'there','when','where','why','how','all','each','few','more',
    'most','other','some','such','no','nor','not','only','own',
    'same','so','than','too','very','just','and','but','if','or',
    'because','until','while','what','which','who','whom','this',
    'that','these','those','am','it','its','i','me','my','myself',
    'we','our','you','your','he','him','his','she','her','they',
    'them','their','tell','about',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 5);
}

export function generateResearchReport(research: ResearchResult): string {
  return [
    `📊 Research Report: "${research.query}"`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Confidence: ${(research.confidence * 100).toFixed(1)}%`,
    `Sources: ${research.sources.map((s) => s.name).join(', ')}`,
    `Latency: ${research.latencyMs}ms`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    research.text,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Sources:`,
    ...research.sources.map((s) => `• ${s.name} (${(s.reliability * 100).toFixed(0)}% reliability)`),
  ].join('\n');
}

// === AUTO-ADDED EXPORTS ===
export type Fact = any;
export type ResearchReport = any;
