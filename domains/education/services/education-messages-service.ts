import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface EducationMessage {
  id: string;
  institution_id: string;
  sender_id: string;
  sender_role: string;
  receiver_id: string;
  class_id: string;
  subject: string;
  body: string;
  attachments: any;
  is_broadcast: boolean;
  is_announcement: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export async function getMessages(filters?: {
  institution_id?: string;
  sender_id?: string;
  receiver_id?: string;
  class_id?: string;
  is_broadcast?: boolean;
  is_announcement?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.sender_id) query = query.eq('sender_id', filters.sender_id);
    if (filters?.receiver_id) query = query.eq('receiver_id', filters.receiver_id);
    if (filters?.class_id) query = query.eq('class_id', filters.class_id);
    if (filters?.is_broadcast !== undefined) query = query.eq('is_broadcast', filters.is_broadcast);
    if (filters?.is_announcement !== undefined) query = query.eq('is_announcement', filters.is_announcement);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as EducationMessage[], error: null };
  } catch (error: any) {
    console.error('getMessages error:', error);
    return { data: [], error };
  }
}

export async function getMessageById(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_messages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: data as EducationMessage, error: null };
  } catch (error: any) {
    console.error('getMessageById error:', error);
    return { data: null, error };
  }
}

export async function sendMessage(message: Partial<EducationMessage>) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_messages')
      .insert([{ ...message, sender_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return { data: data as EducationMessage, error: null };
  } catch (error: any) {
    console.error('sendMessage error:', error);
    return { data: null, error };
  }
}

export async function markMessageAsRead(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as EducationMessage, error: null };
  } catch (error: any) {
    console.error('markMessageAsRead error:', error);
    return { data: null, error };
  }
}

export async function getUnreadMessages(receiverId: string) {
  try {
    const { data, error } = await supabase
      .from('education_messages')
      .select('*')
      .eq('receiver_id', receiverId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: (data || []) as EducationMessage[], error: null };
  } catch (error: any) {
    console.error('getUnreadMessages error:', error);
    return { data: [], error };
  }
}
