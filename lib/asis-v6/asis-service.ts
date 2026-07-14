import { supabase } from '@/lib/supabase';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  thumbnail?: string;
  publishedDate?: string;
}

export interface ASISAnswer {
  query: string;
  answer: string;
  results: SearchResult[];
  images: string[];
  relatedQuestions: string[];
  sources: string[];
}

/**
 * ASIS Search Service
 * Calls the Supabase edge function for real web search
 * No browser CORS issues, no stuck cache
 */
export async function askASIS(query: string, type: 'web' | 'images' | 'news' = 'web'): Promise<ASISAnswer> {
  const { data, error } = await supabase.functions.invoke('asis-search', {
    body: { query, type, limit: 5 }
  });

  if (error) {
    console.error('ASIS search error:', error);
    throw new Error(error.message || 'Search failed');
  }

  return data as ASISAnswer;
}

/**
 * Quick factual query
 */
export async function quickFact(query: string): Promise<string> {
  const result = await askASIS(query);
  return result.answer;
}
