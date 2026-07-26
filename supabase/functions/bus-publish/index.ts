/**
 * MTAA AFRIQ — Bus Publish Edge Function
 * Publishes messages to the messaging bus
 * Deploy: supabase functions deploy bus-publish
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      (globalThis as any).Deno?.env?.get('SUPABASE_URL') || '',
      (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const {
      channel,
      topic,
      payload,
      sender_app,
      priority = 'normal',
      target_user_id,
      target_app,
      correlation_id,
      ttl_seconds = 86400,
    } = body;

    if (!channel || !topic || !sender_app) {
      return new Response(
        JSON.stringify({ error: 'channel, topic, and sender_app required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageId = `bus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const expiresAt = ttl_seconds > 0 ? new Date(Date.now() + ttl_seconds * 1000).toISOString() : null;

    // Insert message
    const { error: insertError } = await supabase.from('bus_messages').insert({
      id: messageId,
      channel,
      topic,
      payload: payload || {},
      priority,
      sender_app,
      target_user_id,
      target_app,
      correlation_id,
      timestamp: now,
      ttl_seconds,
      expires_at: expiresAt,
      delivered_to: [],
      acknowledged_by: [],
    });

    if (insertError) throw insertError;

    // Broadcast via Postgres NOTIFY
    await supabase.rpc('bus_notify', {
      p_channel: channel,
      p_topic: topic,
      p_payload: JSON.stringify({ id: messageId, payload }),
    });

    // Deliver to target user inbox if specified
    if (target_user_id) {
      await supabase.from('user_message_inbox').insert({
        id: `inbox_${Date.now()}`,
        user_id: target_user_id,
        message_id: messageId,
        channel,
        topic,
        payload: payload || {},
      });
    }

    // Deliver to target app queue if specified
    if (target_app) {
      await supabase.from('app_message_queue').insert({
        id: `queue_${Date.now()}`,
        app_id: target_app,
        message_id: messageId,
        channel,
        topic,
        payload: payload || {},
      });
    }

    return new Response(
      JSON.stringify({ message_id: messageId, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Bus publish error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});