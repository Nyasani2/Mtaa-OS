// @ts-nocheck
import { useState, useCallback } from 'react';
import { tribesService } from '../services/tribes.service';
import { Tribe, TribePost, TribeMember } from '../types';

interface UseTribesReturn {
  tribes: Tribe[];
  posts: TribePost[];
  members: TribeMember[];
  loading: boolean;
  error: string | null;
  fetchTribes: () => Promise<void>;
  fetchPosts: (tribeId: string) => Promise<void>;
  fetchMembers: (tribeId: string) => Promise<void>;
  createTribe: (tribeData: Partial<Tribe>) => Promise<void>;
  joinTribe: (tribeId: string, userId: string) => Promise<void>;
  createPost: (tribeId: string, content: string) => Promise<void>;
}

export function useTribes(): UseTribesReturn {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTribes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await (tribesService as any).getTribes();
      setTribes(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tribes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async (tribeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await (tribesService as any).getPosts(user?.id, tribeId);
      setPosts(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async (tribeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await (tribesService as any).getMembers(user?.id, tribeId);
      setMembers(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTribe = useCallback(async (tribeData: Partial<Tribe>) => {
    setLoading(true);
    setError(null);
    try {
      await (tribesService as any).createTribe(user?.id, tribeData);
      await fetchTribes();
    } catch (err: any) {
      setError(err?.message || 'Failed to create tribe');
    } finally {
      setLoading(false);
    }
  }, [fetchTribes]);

  const joinTribe = useCallback(async (tribeId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await tribesService.joinTribe(tribeId, userId);
      await fetchMembers(tribeId);
    } catch (err: any) {
      setError(err?.message || 'Failed to join tribe');
    } finally {
      setLoading(false);
    }
  }, [fetchMembers]);

  const createPost = useCallback(async (tribeId: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      await (tribesService as any).createPost(user?.id, tribeId, { type: 'text', content });
      await fetchPosts(tribeId);
    } catch (err: any) {
      setError(err?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  return {
    tribes,
    posts,
    members,
    loading,
    error,
    fetchTribes,
    fetchPosts,
    fetchMembers,
    createTribe,
    joinTribe,
    createPost,
  };
}
