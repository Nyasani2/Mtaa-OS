// ==========================================================================
// ADD THESE METHODS TO your existing pulseService in pulseService.ts
// Post actions + Studio creation (ported from old feed.js + studiostudio.js)
// ==========================================================================

// Import at top of pulseService.ts:
// import { signalService } from './signalService';

// Add these methods inside the pulseService object:

async likePost(user_id: string, post_id: string): Promise<void> {
  const { error } = await supabase.from('pulse_event_interactions').insert({
    event_id: post_id,
    user_id,
    interaction_type: 'like',
  });
  if (error) throw error;
  await signalService.recordSignal(user_id, { post_id, action: 'like' });
},

async unlikePost(user_id: string, post_id: string): Promise<void> {
  const { error } = await supabase.from('pulse_event_interactions').insert({
    event_id: post_id,
    user_id,
    interaction_type: 'unlike',
  });
  if (error) throw error;
},

async commentPost(user_id: string, post_id: string, content: string, parent_id?: string): Promise<void> {
  const { error } = await supabase.from('pulse_event_interactions').insert({
    event_id: post_id,
    user_id,
    interaction_type: 'comment',
    metadata: { content, parent_id },
  });
  if (error) throw error;
  await signalService.recordSignal(user_id, {
    post_id,
    action: 'comment',
    metadata: { content_length: content.length },
  });
},

async savePost(user_id: string, post_id: string, title: string): Promise<void> {
  const { error } = await supabase.from('pulse_saved_items').insert({
    user_id,
    item_type: 'post',
    item_id: post_id,
    source_module: 'pulse',
    title,
  });
  if (error) throw error;
  await signalService.recordSignal(user_id, { post_id, action: 'save' });
},

async unsavePost(user_id: string, post_id: string): Promise<void> {
  const { error } = await supabase
    .from('pulse_saved_items')
    .delete()
    .eq('user_id', user_id)
    .eq('item_id', post_id)
    .eq('item_type', 'post');
  if (error) throw error;
  await signalService.recordSignal(user_id, { post_id, action: 'unsave' });
},

async notInterested(user_id: string, post_id: string): Promise<void> {
  const { error } = await supabase.from('pulse_event_interactions').insert({
    event_id: post_id,
    user_id,
    interaction_type: 'dismiss',
    metadata: { reason: 'not_interested' },
  });
  if (error) throw error;
  await signalService.recordSignal(user_id, { post_id, action: 'not_interested' });
},

async reportPost(user_id: string, post_id: string, reason: string, description?: string): Promise<void> {
  const { error } = await supabase.from('pulse_reports').insert({
    reporter_id: user_id,
    entity_type: 'post',
    entity_id: post_id,
    reason,
    description,
    status: 'pending',
  });
  if (error) throw error;
},

async sharePost(user_id: string, post_id: string, platform: string = 'internal'): Promise<void> {
  await signalService.recordSignal(user_id, {
    post_id,
    action: 'share',
    metadata: { platform },
  });
},

// ==========================================================================
// STUDIO — Post Creation (ported from old studiostudio.js)
// ==========================================================================

async createPost(params: {
  user_id: string;
  content: string;
  media_url?: string;
  music_url?: string;
  music_start?: number;
  tags?: string[];
}): Promise<PulseEvent> {
  const { data, error } = await supabase.from('pulse_events').insert({
    source: 'feed',
    event_type: 'post_created',
    entity_type: 'post',
    entity_id: crypto.randomUUID(),
    user_id: params.user_id,
    payload: {
      content: params.content,
      media_url: params.media_url,
      music_url: params.music_url,
      music_start: params.music_start || 0,
      tags: params.tags || [],
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      is_duet: false,
      is_collab: false,
    },
    severity: 'info',
  }).select().single();

  if (error) throw error;
  return data;
},

async createDuet(user_id: string, original_post_id: string, media_url: string, content?: string): Promise<PulseEvent> {
  const { data: original } = await supabase
    .from('pulse_events')
    .select('payload')
    .eq('id', original_post_id)
    .single();

  const { data, error } = await supabase.from('pulse_events').insert({
    source: 'feed',
    event_type: 'post_created',
    entity_type: 'post',
    entity_id: crypto.randomUUID(),
    user_id,
    payload: {
      content: content || 'Duet',
      media_url,
      original_post_id,
      original_media_url: original?.payload?.media_url,
      is_duet: true,
      is_collab: false,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
    },
    severity: 'info',
  }).select().single();

  if (error) throw error;
  return data;
},

async createCollab(user_id: string, media_url: string, collab_users: string[], content?: string): Promise<PulseEvent> {
  const { data, error } = await supabase.from('pulse_events').insert({
    source: 'feed',
    event_type: 'post_created',
    entity_type: 'post',
    entity_id: crypto.randomUUID(),
    user_id,
    payload: {
      content: content || 'Collab',
      media_url,
      collab_users,
      is_duet: false,
      is_collab: true,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
    },
    severity: 'info',
  }).select().single();

  if (error) throw error;
  return data;
},
