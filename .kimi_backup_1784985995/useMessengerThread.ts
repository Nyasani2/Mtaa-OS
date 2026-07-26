/**
 * MTAA OS V10 — useMessengerThread Hook
 * Single thread: messages, send, edit, delete, read receipts
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchThreadMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markThreadAsRead,
  addAttachment,
  MessengerMessage,
} from '@/lib/services/messenger-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useMessengerThread(threadId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!threadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchThreadMessages(threadId, { limit: 50 });
      setMessages(data.reverse()); // Oldest first for chat UI
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const send = useCallback(async (content: string, contentType: MessengerMessage['content_type'] = 'text', metadata?: any) => {
    if (!userId || !threadId) throw new Error('Invalid send');
    setIsSending(true);
    try {
      const msg = await sendMessage({
        thread_id: threadId,
        sender_id: userId,
        content,
        content_type: contentType,
        metadata: metadata ?? null,
      });
      setMessages((prev) => [...prev, { ...msg, messenger_attachments: [] }]);
      return msg;
    } finally {
      setIsSending(false);
    }
  }, [userId, threadId]);

  const sendWithAttachment = useCallback(async (content: string, fileUrl: string, fileType: string, fileName: string, fileSize: number) => {
    if (!userId || !threadId) throw new Error('Invalid send');
    setIsSending(true);
    try {
      const msg = await sendMessage({
        thread_id: threadId,
        sender_id: userId,
        content,
        content_type: fileType.startsWith('image/') ? 'image' : fileType.startsWith('video/') ? 'video' : 'file',
      });
      await addAttachment({
        message_id: msg.id,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
      });
      setMessages((prev) => [...prev, { ...msg, messenger_attachments: [{ file_url: fileUrl, file_type: fileType, file_name: fileName }] }]);
      return msg;
    } finally {
      setIsSending(false);
    }
  }, [userId, threadId]);

  const edit = useCallback(async (messageId: string, content: string) => {
    const updated = await editMessage(messageId, content);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
    return updated;
  }, []);

  const remove = useCallback(async (messageId: string) => {
    await deleteMessage(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const markRead = useCallback(async () => {
    if (!userId || !threadId) return;
    await markThreadAsRead(threadId, userId);
  }, [userId, threadId]);

  useEffect(() => {
    load();
    markRead();
  }, [load, markRead]);

  return {
    messages, isLoading, isSending, error,
    refresh: load, send, sendWithAttachment, edit, remove, markRead,
  };
}
