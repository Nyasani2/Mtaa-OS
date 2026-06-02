import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createService } from '../services/createService';
import type { CreatePostInput, CreateLiveInput, CreateStoryInput } from '../types';

export function useCreate() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<CreatePostInput>>({});
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);

  const createPost = useMutation({
    mutationFn: (input: CreatePostInput) => createService.createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['streets', 'profile'] });
      setDraft({});
      setMediaPreview([]);
    },
  });

  const createLive = useMutation({
    mutationFn: (input: CreateLiveInput) => createService.createLive(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'live'] });
      setIsLive(true);
    },
  });

  const createStory = useMutation({
    mutationFn: (input: CreateStoryInput) => createService.createStory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'stories'] });
    },
  });

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
    createPost,
    createLive,
    createStory,
    updateDraft,
    addMedia,
    removeMedia,
    setIsLive,
  };
}
