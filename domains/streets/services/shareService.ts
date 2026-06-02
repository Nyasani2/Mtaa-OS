// lib/streets/services/shareService.ts
// MTAA Streets — Share Service (wired to streets_shares + streets_messages)

import { supabase } from '@/lib/supabase';

export async function shareToFeed(postId: string, userId: string, message?: string): Promise<void> {
  const { error } = await supabase
    .from('streets_shares')
    .insert({ post_id: postId, user_id: userId, message: message || null, share_type: 'feed' });
  if (error) throw error;
}

export async function shareToDM(postId: string, senderId: string, recipientIds: string[], message?: string): Promise<void> {
  for (const recipientId of recipientIds) {
    const { data: conv } = await supabase
      .from('streets_conversations')
      .select('id')
      .eq('type', 'direct')
      .contains('participant_ids', [senderId, recipientId])
      .single();

    let conversationId = conv?.id;
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('streets_conversations')
        .insert({
          type: 'direct',
          participant_ids: [senderId, recipientId],
        })
        .select('id')
        .single();
      if (convError) throw convError;
      conversationId = newConv.id;
    }

    const { error: msgError } = await supabase
      .from('streets_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: message || '',
        media_urls: [],
        media_type: 'none',
        shared_post_id: postId,
      });
    if (msgError) throw msgError;
  }
}

export async function shareToTribe(postId: string, userId: string, tribeId: string, message?: string): Promise<void> {
  const { error } = await supabase
    .from('streets_shares')
    .insert({ post_id: postId, user_id: userId, message: message || null, share_type: 'tribe', tribe_id: tribeId });
  if (error) throw error;
}

export async function copyLink(postId: string): Promise<string> {
  return `https://mtaa.app/streets/post/${postId}`;
}

export async function getShareCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('streets_shares')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (error) throw error;
  return count || 0;
}
