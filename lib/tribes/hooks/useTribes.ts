import { useState, useEffect, useCallback } from 'react';
import { tribeService } from '../services/tribeService';
import { Tribe, TribeMember, TribePost, TribeEvent, TribeMessage } from '../types';

export function useTribes(filters?: { category?: string; search?: string }) {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadTribes(); }, [filters?.category, filters?.search]);

  const loadTribes = async () => {
    try { setLoading(true); const data = await tribeService.getTribes(filters); setTribes(data); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return { tribes, loading, error, refresh: loadTribes };
}

export function useTribe(slug: string) {
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [membership, setMembership] = useState<TribeMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTribe(); }, [slug]);

  const loadTribe = async () => {
    try {
      const tribeData = await tribeService.getTribeBySlug(slug);
      const membershipData = await tribeService.getMyMembership(tribeData.id).catch(() => null);
      setTribe(tribeData); setMembership(membershipData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const join = async () => { if (!tribe) return; await tribeService.joinTribe(tribe.id); await loadTribe(); };

  return { tribe, membership, loading, join, refresh: loadTribe };
}

export function useTribePosts(tribeId: string) {
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPosts(); }, [tribeId]);

  const loadPosts = async () => { const data = await tribeService.getTribePosts(tribeId); setPosts(data); setLoading(false); };

  const createPost = async (content: string, contentType = 'text') => {
    const post = await tribeService.createPost({ tribe_id: tribeId, content, content_type: contentType });
    setPosts(prev => [post, ...prev]);
  };

  return { posts, loading, createPost, refresh: loadPosts };
}

export function useTribeChat(tribeId: string) {
  const [messages, setMessages] = useState<TribeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    const subscription = tribeService.subscribeToMessages(tribeId, (message) => {
      setMessages(prev => [message, ...prev]);
    });
    return () => { subscription.unsubscribe(); };
  }, [tribeId]);

  const loadMessages = async () => { const data = await tribeService.getTribeMessages(tribeId); setMessages(data.reverse()); setLoading(false); };

  const sendMessage = async (content: string) => {
    const message = await tribeService.sendMessage(tribeId, content);
    setMessages(prev => [...prev, message]);
  };

  return { messages, loading, sendMessage };
}
