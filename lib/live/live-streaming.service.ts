// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface LiveStream {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  category: 'tribes' | 'streets' | 'studio' | 'education' | 'general';
  category_id?: string;
  thumbnail_url?: string;
  stream_url?: string;
  status: 'scheduled' | 'live' | 'ended';
  is_paid: boolean;
  access_tiers: number[];
  viewer_count: number;
  total_tips: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface LiveTip {
  id: string;
  stream_id: string;
  sender_id: string;
  recipient_id: string;
  amount: 10 | 20 | 50 | 100 | 500 | 1000;
  message?: string;
  is_anonymous: boolean;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

// Create a new live stream
export async function createLiveStream(data: Partial<LiveStream>) {
  const { data: stream, error } = await supabase
    .from('live_streams')
    .insert({
      ...data,
      status: 'scheduled',
      access_tiers: data.access_tiers || [10, 20, 50, 100, 500, 1000],
    })
    .select()
    .single();
  
  if (error) throw error;
  return stream;
}

// Start streaming (go live)
export async function startLiveStream(streamId: string) {
  const { data, error } = await supabase
    .from('live_streams')
    .update({ 
      status: 'live', 
      started_at: new Date().toISOString() 
    })
    .eq('id', streamId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// End live stream
export async function endLiveStream(streamId: string) {
  const { data, error } = await supabase
    .from('live_streams')
    .update({ 
      status: 'ended', 
      ended_at: new Date().toISOString() 
    })
    .eq('id', streamId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Send a tip during live stream
export async function sendTip(streamId: string, recipientId: string, amount: number, message?: string, isAnonymous = false) {
  // Validate amount
  const validAmounts = [10, 20, 50, 100, 500, 1000];
  if (!validAmounts.includes(amount)) {
    throw new Error('Invalid tip amount. Must be 10, 20, 50, 100, 500, or 1000');
  }

  const senderId = (await supabase.auth.getUser()).data.user?.id;
  if (!senderId) throw new Error('Must be authenticated to send tips');

  // Create tip record
  const { data: tip, error: tipError } = await supabase
    .from('live_stream_tips')
    .insert({
      stream_id: streamId,
      sender_id: senderId,
      recipient_id: recipientId,
      amount,
      message,
      is_anonymous: isAnonymous,
      payment_status: 'pending', // Will be updated after payment processing
    })
    .select()
    .single();

  if (tipError) throw tipError;

  // TODO: Integrate with payment gateway (M-Pesa, Stripe, etc.)
  // For now, we'll mark as completed after a delay (simulated)
  setTimeout(async () => {
    await supabase
      .from('live_stream_tips')
      .update({ payment_status: 'completed' })
      .eq('id', tip.id);
    
    // Update total tips on stream
    await supabase.rpc('increment_stream_tips', { 
      stream_id: streamId, 
      tip_amount: amount 
    });
  }, 1000);

  return tip;
}

// Get live stream by ID
export async function getLiveStream(streamId: string) {
  const { data, error } = await supabase
    .from('live_streams')
    .select(`
      *,
      creator:user_profiles!creator_id (full_name, avatar_url, username),
      tips:live_stream_tips (
        id,
        amount,
        is_anonymous,
        sender:user_profiles!sender_id (full_name, avatar_url),
        created_at
      )
    `)
    .eq('id', streamId)
    .single();

  if (error) throw error;
  return data;
}

// Get active live streams
export async function getActiveLiveStreams(category?: string, categoryId?: string) {
  let query = supabase
    .from('live_streams')
    .select(`
      *,
      creator:user_profiles!creator_id (full_name, avatar_url, username)
    `)
    .eq('status', 'live')
    .order('viewer_count', { ascending: false });

  if (category) {
    query = query.eq('category', category);
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Join a live stream (track viewer)
export async function joinLiveStream(streamId: string, userId: string) {
  const { error } = await supabase
    .from('live_stream_viewers')
    .upsert({
      stream_id: streamId,
      user_id: userId,
      joined_at: new Date().toISOString(),
    }, { onConflict: 'stream_id,user_id' });

  if (error) throw error;

  // Increment viewer count
  await supabase.rpc('increment_viewer_count', { stream_id: streamId });
}

// Leave a live stream
export async function leaveLiveStream(streamId: string, userId: string) {
  const { error } = await supabase
    .from('live_stream_viewers')
    .update({ left_at: new Date().toISOString() })
    .eq('stream_id', streamId)
    .eq('user_id', userId);

  if (error) throw error;

  // Decrement viewer count
  await supabase.rpc('decrement_viewer_count', { stream_id: streamId });
}

// Send chat message during live stream
export async function sendLiveMessage(streamId: string, content: string, isModerator = false) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Must be authenticated to chat');

  const { data, error } = await supabase
    .from('live_stream_messages')
    .insert({
      stream_id: streamId,
      user_id: userId,
      content,
      is_moderator: isModerator,
    })
    .select(`
      *,
      user:user_profiles!user_id (full_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

// Get live chat messages
export async function getLiveMessages(streamId: string, limit = 50) {
  const { data, error } = await supabase
    .from('live_stream_messages')
    .select(`
      *,
      user:user_profiles!user_id (full_name, avatar_url)
    `)
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Get tips for a stream
export async function getStreamTips(streamId: string) {
  const { data, error } = await supabase
    .from('live_stream_tips')
    .select(`
      *,
      sender:user_profiles!sender_id (full_name, avatar_url)
    `)
    .eq('stream_id', streamId)
    .eq('payment_status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Real-time subscriptions
export function subscribeToLiveStream(streamId: string, callbacks: {
  onViewerCount?: (count: number) => void;
  onTip?: (tip: LiveTip) => void;
  onMessage?: (message: any) => void;
  onStreamEnd?: () => void;
}) {
  const channels: any[] = [];

  // Subscribe to viewer count changes
  if (callbacks.onViewerCount) {
    const viewerChannel = supabase
      .channel(`viewers:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_stream_viewers',
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        // Fetch updated viewer count
        supabase
          .from('live_streams')
          .select('viewer_count')
          .eq('id', streamId)
          .single()
          .then(({ data }) => {
            if (data) callbacks.onViewerCount?.(data.viewer_count);
          });
      })
      .subscribe();
    channels.push(viewerChannel);
  }

  // Subscribe to new tips
  if (callbacks.onTip) {
    const tipChannel = supabase
      .channel(`tips:${streamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_stream_tips',
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        callbacks.onTip?.(payload.new as LiveTip);
      })
      .subscribe();
    channels.push(tipChannel);
  }

  // Subscribe to chat messages
  if (callbacks.onMessage) {
    const messageChannel = supabase
      .channel(`messages:${streamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_stream_messages',
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        callbacks.onMessage?.(payload.new);
      })
      .subscribe();
    channels.push(messageChannel);
  }

  // Subscribe to stream ending
  if (callbacks.onStreamEnd) {
    const streamChannel = supabase
      .channel(`stream:${streamId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_streams',
        filter: `id=eq.${streamId}`,
      }, (payload) => {
        if (payload.new.status === 'ended') {
          callbacks.onStreamEnd?.();
        }
      })
      .subscribe();
    channels.push(streamChannel);
  }

  // Return unsubscribe function
  return () => {
    channels.forEach(channel => channel.unsubscribe());
  };
}
