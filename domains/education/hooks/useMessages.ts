import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getMessages, sendMessage, broadcastToClass } from '@/domains/education/services/messageService';

export function useMessages(institutionId?: string) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    const { data } = await getMessages(institutionId);
    if (data) setMessages(data);
    setLoading(false);
  }, [institutionId]);

  useEffect(() => { load(); }, [load]);

  const send = async (content: string, receiverId?: string) => {
    if (!user?.id) return { data: null, error: 'Not authenticated' };
    const res = await sendMessage({ institution_id: institutionId, sender_id: user.id, receiver_id: receiverId, content });
    if (!res.error) load();
    return res;
  };

  const broadcast = async (classId: string, message: string) => {
    if (!user?.id) return { data: null, error: 'Not authenticated' };
    const res = await broadcastToClass(classId, message, user.id);
    if (!res.error) load();
    return res;
  };

  return { messages, loading, send, broadcast, refresh: load };
}
