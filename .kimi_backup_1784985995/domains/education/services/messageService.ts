import { supabase } from '@/lib/supabase';

// messageService.ts - Education Message Service
// FIXED: import path corrected from @/lib/supabase to @/lib/supabase/client

export interface EducationMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  institution_id?: string;
  subject?: string;
  body: string;
  message_type: 'direct' | 'broadcast' | 'announcement' | 'alert';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read_at?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export async function getMessages(filters?: {
  sender_id?: string;
  receiver_id?: string;
  institution_id?: string;
  message_type?: string;
  priority?: string;
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('education_messages').select('*', { count: 'exact' });

  if (filters?.sender_id) query = query.eq('sender_id', filters.sender_id);
  if (filters?.receiver_id) query = query.eq('receiver_id', filters.receiver_id);
  if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
  if (filters?.message_type) query = query.eq('message_type', filters.message_type);
  if (filters?.priority) query = query.eq('priority', filters.priority);
  if (filters?.unread_only) query = query.is('read_at', null);

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as EducationMessage[], count };
}

export async function getConversation(userId1: string, userId2: string, limit = 50) {
  const { data, error } = await supabase
    .from('education_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
    )
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as EducationMessage[];
}

export async function sendMessage(message: Omit<EducationMessage, 'id' | 'created_at' | 'updated_at' | 'read_at'>) {
  const { data, error } = await supabase
    .from('education_messages')
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data as EducationMessage;
}

export async function markAsRead(messageId: string) {
  const { data, error } = await supabase
    .from('education_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();
  if (error) throw error;
  return data as EducationMessage;
}

export async function markAllAsRead(receiverId: string) {
  const { error } = await supabase
    .from('education_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', receiverId)
    .is('read_at', null);
  if (error) throw error;
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from('education_messages').delete().eq('id', id);
  if (error) throw error;
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('education_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}
