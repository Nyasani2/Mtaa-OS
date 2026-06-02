import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { shareService } from '../services/shareService';
import type { ShareTarget, ShareOptions } from '../types';

export function useShare(postId: string) {
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const shareMutation = useMutation({
    mutationFn: (options: ShareOptions) => shareService.sharePost(postId, options),
  });

  const copyLink = useCallback(async () => {
    await shareService.copyLink(postId);
    setShowShareSheet(false);
  }, [postId]);

  const shareTo = useCallback(async (target: ShareTarget, message?: string) => {
    await shareMutation.mutateAsync({ target, message });
    setShowShareSheet(false);
  }, [postId, shareMutation]);

  const shareToStory = useCallback(async () => {
    await shareService.shareToStory(postId);
    setShowShareSheet(false);
  }, [postId]);

  return {
    showShareSheet,
    setShowShareSheet,
    shareMessage,
    setShareMessage,
    copyLink,
    shareTo,
    shareToStory,
    isSharing: shareMutation.isPending,
  };
}
