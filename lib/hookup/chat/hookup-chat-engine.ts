import { supabase } from '@/lib/supabase';

export async function sendMessage(
  conversation_id: string,
  sender_id: string,
  content: string,
  media_url?: string,
  media_type?: 'image' | 'video' | 'file'
) {
  const { data, error } = await supabase
    .from('hookup_messages')
    .insert({
      conversation_id,
      sender_id,
      content,
      media_url: media_url || null,
      media_type: media_type || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMessages(conversation_id: string) {
  const { data, error } = await supabase
    .from('hookup_messages')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function subscribeToMessages(
  conversation_id: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`hookup-chat-${conversation_id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'hookup_messages',
        filter: `conversation_id=eq.${conversation_id}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}
