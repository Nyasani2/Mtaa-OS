import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboxService } from '../services/inboxService';
import type { InboxMessage, MessageThread } from '../types';

export function useInbox() {
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: threads, isLoading } = useQuery({
    queryKey: ['streets', 'inbox', 'threads'],
    queryFn: () => inboxService.getThreads(),
  });

  const { data: messages } = useQuery({
    queryKey: ['streets', 'inbox', 'messages', selectedThread],
    queryFn: () => selectedThread ? inboxService.getMessages(selectedThread) : [],
    enabled: !!selectedThread,
  });

  const sendMessage = useMutation({
    mutationFn: ({ threadId, text }: { threadId: string; text: string }) =>
      inboxService.sendMessage(threadId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'inbox', 'messages', selectedThread] });
    },
  });

  const markRead = useMutation({
    mutationFn: (threadId: string) => inboxService.markAsRead(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'inbox', 'threads'] });
    },
  });

  const deleteThread = useMutation({
    mutationFn: (threadId: string) => inboxService.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'inbox', 'threads'] });
      setSelectedThread(null);
    },
  });

  const filteredThreads = threads?.filter(t =>
    t.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    threads: filteredThreads,
    messages,
    isLoading,
    selectedThread,
    setSelectedThread,
    searchQuery,
    setSearchQuery,
    sendMessage,
    markRead,
    deleteThread,
  };
}
