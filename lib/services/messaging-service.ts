import { supabase } from '@/lib/supabase/client';
import type { FunctionsHttpError } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

async function invokeEdgeFunction<T>(functionName: string, body?: Record<string, any>): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    if (error) {
      const httpError = error as FunctionsHttpError;
      return { data: null, error: httpError.message || `Edge function ${functionName} failed` };
    }
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || `Failed to call ${functionName}` };
  }
}

export async function getMessages(userId: string, otherUserId: string, limit: number = 50): Promise<ServiceResult<Message[]>> {
  return invokeEdgeFunction('messaging-operations', { action: 'get_conversation', user_id: userId, other_user_id: otherUserId, limit });
}

export async function getConversations(userId: string): Promise<ServiceResult<Message[]>> {
  return invokeEdgeFunction('messaging-operations', { action: 'get_conversations', user_id: userId });
}

export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<ServiceResult<Message>> {
  return invokeEdgeFunction('messaging-operations', { action: 'send_message', sender_id: senderId, receiver_id: receiverId, content });
}

export async function markAsRead(messageIds: string[]): Promise<ServiceResult<null>> {
  return invokeEdgeFunction('messaging-operations', { action: 'mark_read', message_ids: messageIds });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { data, error } = await invokeEdgeFunction<{ count: number }>('messaging-operations', { action: 'get_unread_count', user_id: userId });
  if (error) return 0;
  return data?.count ?? 0;
}
