import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'product' | 'job' | 'property' | 'restaurant' | 'tribe';
  title: string;
  subtitle?: string;
  image_url?: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  types?: SearchResult['type'][];
  dateRange?: { from: string; to: string };
  location?: { lat: number; lng: number; radius: number };
  sortBy?: 'relevance' | 'date' | 'popularity';
}

export async function globalSearch(query: string, filters?: SearchFilters, page: number = 1, limit: number = 20): Promise<{ results: SearchResult[]; total: number }> {
  if (!query.trim()) return { results: [], total: 0 };
  const { data, error } = await supabase.rpc('global_search', {
    search_query: query.trim(),
    result_types: filters?.types || null,
    page_num: page,
    page_limit: limit,
    sort_by: filters?.sortBy || 'relevance',
  });
  if (error) throw new Error(error.message);
  return { results: data?.results || [], total: data?.total_count || 0 };
}

export async function searchUsers(query: string, limit: number = 10): Promise<SearchResult[]> {
  const { data, error } = await supabase.from('user_profiles').select('id, display_name, username, avatar_url, bio').ilike('display_name', `%${query}%`).limit(limit);
  if (error) throw new Error(error.message);
  return (data || []).map((u: any) => ({ id: u.id, type: 'user', title: u.display_name || u.username || 'Unknown', subtitle: u.bio, image_url: u.avatar_url, score: 1 }));
}

export async function searchPosts(query: string, limit: number = 20): Promise<SearchResult[]> {
  const { data, error } = await supabase.from('streets_posts').select('id, content, caption, media_url, media_type, creator_id, creator:creator_id(display_name, avatar_url)').or(`content.ilike.%${query}%,caption.ilike.%${query}%`).limit(limit);
  if (error) throw new Error(error.message);
  return (data || []).map((p: any) => ({ id: p.id, type: 'post', title: p.content || p.caption || 'Post', subtitle: (p as any).creator?.display_name, image_url: p.media_url, score: 1 }));
}

export function useSearchHistory() {
  const { user } = useAuthStore();
  const getHistory = async (): Promise<string[]> => {
    if (!user) return [];
    const { data } = await supabase.from('search_history').select('query').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    return (data || []).map((h: any) => h.query);
  };
  const saveQuery = async (query: string) => {
    if (!user || !query.trim()) return;
    await supabase.from('search_history').upsert({ user_id: user.id, query: query.trim() }, { onConflict: 'user_id,query' });
  };
  const clearHistory = async () => {
    if (!user) return;
    await supabase.from('search_history').delete().eq('user_id', user.id);
  };
  return { getHistory, saveQuery, clearHistory };
}
