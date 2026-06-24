import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, payload } = await req.json();

    switch (action) {
      case 'increment_post_likes': {
        const { post_id } = payload;
        await supabaseClient.rpc('increment_post_likes', { post_id });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'decrement_post_likes': {
        const { post_id } = payload;
        await supabaseClient.rpc('decrement_post_likes', { post_id });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'increment_post_comments': {
        const { post_id } = payload;
        await supabaseClient.rpc('increment_post_comments', { post_id });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'increment_live_viewers': {
        const { stream_id } = payload;
        await supabaseClient.rpc('increment_live_viewers', { stream_id });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'decrement_live_viewers': {
        const { stream_id } = payload;
        await supabaseClient.rpc('decrement_live_viewers', { stream_id });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'create_notification': {
        const { recipient_id, type, actor_id, post_id, content } = payload;
        await supabaseClient.from('streets_notifications').insert({
          recipient_id, type, actor_id, post_id, content,
        });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
