
import { supabase } from '@/lib/supabase';
import { Message } from '../types/education.types';

export async function getMessages(institutionId: string, userId: string) {
  const { data, error } = await supabase
    .from('education_messages')
    .select('*')
    .eq('institution_id', institutionId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(message: Partial<Message>) {
  const { data, error } = await supabase
    .from('education_messages')
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function broadcastToClass(institutionId: string, classId: string, subject: string, body: string, senderId: string) {
  const { data, error } = await supabase
    .from('education_messages')
    .insert({
      institution_id: institutionId,
      class_id: classId,
      sender_id: senderId,
      sender_role: 'teacher',
      subject,
      body,
      is_broadcast: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
