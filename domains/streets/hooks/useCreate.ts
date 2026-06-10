// domains/streets/hooks/useCreate.ts
// MTAA Streets — Create Hook (no React Query dependency)

import { useState, useCallback } from 'react';
import { createService } from '../services/createService';
import { useStreetsStore } from '../state';
import type { CreatePostInput, CreateLiveInput, CreateStoryInput } from '../types';

export function useCreate() {
  const store = useStreetsStore();
  const [draft, setDraft] = useState<Partial<CreatePostInput>>({});
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(async (input: CreatePostInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const post = await createService.createPost(input);
      // Optimistically add to feed
      store.addPost(post);
      setDraft({});
      setMediaPreview([]);
      return post;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  const createLive = useCallback(async (input: CreateLiveInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const live = await createService.createLive(input);
      setIsLive(true);
      return live;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createStory = useCallback(async (input: CreateStoryInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const story = await createService.createStory(input);
      return story;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDraft = useCallback((updates: Partial<CreatePostInput>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const addMedia = useCallback((uri: string) => {
    setMediaPreview(prev => [...prev, uri]);
  }, []);

  const removeMedia = useCallback((index: number) => {
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    draft,
    mediaPreview,
    isLive,
    isLoading,
    error,
    createPost,
    createLive,
    createStory,
    updateDraft,
    addMedia,
    removeMedia,
    setIsLive,
  };
}
