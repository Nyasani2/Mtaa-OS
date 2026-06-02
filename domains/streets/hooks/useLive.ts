import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { liveService } from '../services/liveService';
import type { LiveStream, LiveComment } from '../types';

export function useLive(streamId?: string) {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const { data: stream } = useQuery({
    queryKey: ['streets', 'live', streamId],
    queryFn: () => streamId ? liveService.getStream(streamId) : null,
    enabled: !!streamId,
  });

  const startStream = useMutation({
    mutationFn: (title: string) => liveService.startStream(title),
    onSuccess: () => setIsLive(true),
  });

  const endStream = useMutation({
    mutationFn: () => liveService.endStream(streamId!),
    onSuccess: () => setIsLive(false),
  });

  const sendComment = useMutation({
    mutationFn: (text: string) => liveService.sendComment(streamId!, text),
    onSuccess: () => setCommentText(''),
  });

  useEffect(() => {
    if (!streamId || !isLive) return;
    intervalRef.current = setInterval(async () => {
      const status = await liveService.getStreamStatus(streamId);
      setViewerCount(status.viewerCount);
      setComments(status.recentComments);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [streamId, isLive]);

  return {
    stream,
    isLive,
    viewerCount,
    comments,
    commentText,
    setCommentText,
    startStream,
    endStream,
    sendComment,
  };
}
