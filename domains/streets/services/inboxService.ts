// lib/streets/services/inboxService.ts
// MTAA Streets — Inbox / Messaging Service (wired to streets_messages + streets_conversations)

import { supabase } from '@/lib/supabase';
import { StreetMessage, StreetConversation } from '../types';

const PAGE_SIZE = 30;

export async function fetchConversations(userId: string): Promise<StreetConversation[]> {
  const { data, error } = await supabase
    .from('streets_conversations')
    .select(`
      *,
      participants:user_profiles(id, display_name, handle, avatar_url, is_verified),
      last_message:streets_messages!inner(id, content, created_at, sender_id, media_type)
    `)
    .contains('participant_ids', [userId])
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    avatar_url: row.avatar_url,
    participant_ids: row.participant_ids,
    last_message: row.last_message,
    unread_count: row.unread_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    participants: row.participants,
  }));
}

export async function fetchMessages(
  conversationId: string,
  page: number = 0
): Promise<{ messages: StreetMessage[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('streets_messages')
    .select(`
      *,
      sender:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw error;

  const messages: StreetMessage[] = (data || []).map((row: any) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    content: row.content,
    media_urls: row.media_urls || [],
    media_type: row.media_type || 'none',
    is_read: row.is_read,
    read_at: row.read_at,
    reply_to_id: row.reply_to_id,
    created_at: row.created_at,
    sender: row.sender,
  }));

  return { messages: messages.reverse(), hasMore: messages.length === PAGE_SIZE };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  mediaUrls?: string[],
  mediaType?: 'image' | 'video' | 'audio' | 'file' | 'none',
  replyToId?: string
): Promise<StreetMessage> {
  const { data, error } = await supabase
    .from('streets_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      media_urls: mediaUrls || [],
      media_type: mediaType || 'none',
      reply_to_id: replyToId || null,
      is_read: false,
    })
    .select(`
      *,
      sender:user_profiles(id, display_name, handle, avatar_url, is_verified)
    `)
    .single();

  if (error) throw error;

  await supabase
    .from('streets_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    sender_id: data.sender_id,
    content: data.content,
    media_urls: data.media_urls || [],
    media_type: data.media_type || 'none',
    is_read: data.is_read,
    read_at: data.read_at,
    reply_to_id: data.reply_to_id,
    created_at: data.created_at,
    sender: data.sender,
  };
}

export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function createGroupConversation(
  creatorId: string,
  participantIds: string[],
  name: string,
  avatarUrl?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('streets_conversations')
    .insert({
      type: 'group',
      name,
      avatar_url: avatarUrl || null,
      participant_ids: [creatorId, ...participantIds],
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function subscribeToMessages(
  conversationId: string,
  callback: (message: StreetMessage) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'streets_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('streets_messages')
          .select(`
            *,
            sender:user_profiles(id, display_name, handle, avatar_url, is_verified)
          `)
          .eq('id', payload.new.id)
          .single();
        if (data) callback(data as StreetMessage);
      }
    )
    .subscribe();
}
