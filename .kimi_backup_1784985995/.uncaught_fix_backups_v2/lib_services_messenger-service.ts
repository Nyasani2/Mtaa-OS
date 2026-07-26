/**
 * MTAA OS V10 — Messenger Service
 * Tables: messenger_threads, messenger_messages, messenger_attachments, messenger_read_receipts, messenger_participants
 */
import { supabase } from '@/lib/supabase/client';

export interface MessengerThread {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  created_by: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessengerMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string | null;
  content_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location';
  metadata: any | null;
  reply_to_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessengerAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

// ── THREADS ───────────────────────────────────────────────

export async function fetchMessengerThreads(userId: string) {
  const { data, error } = await supabase
    .from('messenger_participants')
    .select('thread_id')
    .eq('user_id', userId);
  if (error) throw error;

  const threadIds = (data ?? []).map((d: any) => d.thread_id);
  if (threadIds.length === 0) return [];

  const { data: threads, error: tErr } = await supabase
    .from('messenger_threads')
    .select('*')
    .in('id', threadIds)
    .order('last_message_at', { ascending: false });
  if (tErr) throw tErr;
  return (threads ?? []) as MessengerThread[];
}

export async function fetchThreadParticipants(threadId: string) {
  const { data, error } = await supabase
    .from('messenger_participants')
    .select('user_id')
    .eq('thread_id', threadId);
  if (error) throw error;
  return (data ?? []).map((d: any) => d.user_id) as string[];
}

export async function createDirectThread(userA: string, userB: string) {
  // Check if thread already exists
  const { data: existing } = await supabase.rpc('find_direct_thread', { user_a: userA, user_b: userB });
  if (existing) return existing as MessengerThread;

  const { data: thread, error } = await supabase
    .from('messenger_threads')
    .insert({ type: 'direct', created_by: userA })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('messenger_participants').insert([
    { thread_id: thread.id, user_id: userA },
    { thread_id: thread.id, user_id: userB },
  ]);

  return thread as MessengerThread;
}

export async function createGroupThread(createdBy: string, title: string, participantIds: string[]) {
  const { data: thread, error } = await supabase
    .from('messenger_threads')
    .insert({ type: 'group', title, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;

  const participants = [...new Set([createdBy, ...participantIds])].map((uid) => ({
    thread_id: thread.id,
    user_id: uid,
  }));
  await supabase.from('messenger_participants').insert(participants);

  return thread as MessengerThread;
}

// ── MESSAGES ──────────────────────────────────────────────

export async function fetchThreadMessages(threadId: string, options: { limit?: number; before?: string } = {}) {
  const { limit = 50, before } = options;
  let q = supabase
    .from('messenger_messages')
    .select('*, messenger_attachments(*)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (before) q = q.lt('created_at', before);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function sendMessage(payload: Partial<MessengerMessage>) {
  const { data, error } = await supabase.from('messenger_messages').insert(payload).select().single();
  if (error) throw error;

  // Update thread last_message_at
  await supabase
    .from('messenger_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', payload.thread_id);

  return data as MessengerMessage;
}

export async function editMessage(messageId: string, content: string) {
  const { data, error } = await supabase
    .from('messenger_messages')
    .update({ content, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();
  if (error) throw error;
  return data as MessengerMessage;
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase.from('messenger_messages').delete().eq('id', messageId);
  if (error) throw error;
}

// ── ATTACHMENTS ───────────────────────────────────────────

export async function addAttachment(payload: Partial<MessengerAttachment>) {
  const { data, error } = await supabase.from('messenger_attachments').insert(payload).select().single();
  if (error) throw error;
  return data as MessengerAttachment;
}

// ── READ RECEIPTS ─────────────────────────────────────────

export async function markThreadAsRead(threadId: string, userId: string) {
  const { data: messages } = await supabase
    .from('messenger_messages')
    .select('id')
    .eq('thread_id', threadId)
    .neq('sender_id', userId);

  const messageIds = (messages ?? []).map((m: any) => m.id);
  if (messageIds.length === 0) return;

  const receipts = messageIds.map((mid: string) => ({
    message_id: mid,
    user_id: userId,
    read_at: new Date().toISOString(),
  }));

  await supabase.from('messenger_read_receipts').upsert(receipts, { onConflict: 'message_id,user_id' });
}

export async function fetchUnreadCount(userId: string) {
  const { data, error } = await supabase.rpc('messenger_unread_count', { p_user_id: userId });
  if (error) throw error;
  return data ?? 0;
}
