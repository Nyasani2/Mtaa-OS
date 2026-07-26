import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface InboxMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useInbox() {
  const { user, session } = useAuthStore();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user || !session) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('streets_messages')
        .select('id, sender_id, content, read, created_at, sender:user_profiles(full_name)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const mapped = (data || []).map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_name: m.sender?.full_name || 'Unknown',
        content: m.content,
        read: m.read,
        created_at: m.created_at,
      }));
      setMessages(mapped);
      setUnreadCount(mapped.filter((m: InboxMessage) => !m.read).length);
    } catch (err) {
      console.error('useInbox error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase.from('streets_messages').update({ read: true }).eq('id', messageId);
      if (error) throw error;
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, read: true } : m));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, unreadCount, loading, fetchMessages, markAsRead };
}
