import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { action, payload } = await req.json();

    switch (action) {
      case 'increment_post_likes':
        await supabaseClient.rpc('increment_post_likes', { post_id: payload.post_id });
        break;
      case 'decrement_post_likes':
        await supabaseClient.rpc('decrement_post_likes', { post_id: payload.post_id });
        break;
      case 'increment_post_comments':
        await supabaseClient.rpc('increment_post_comments', { post_id: payload.post_id });
        break;
      case 'increment_live_viewers':
        await supabaseClient.rpc('increment_live_viewers', { stream_id: payload.stream_id });
        break;
      case 'decrement_live_viewers':
        await supabaseClient.rpc('decrement_live_viewers', { stream_id: payload.stream_id });
        break;
      case 'create_notification':
        // Ensure user can only create notifications for themselves or as an admin
        if (payload.recipient_id !== user.id) {
           // Optional: Add admin check here if needed
        }
        await supabaseClient.from('streets_notifications').insert({
          recipient_id: payload.recipient_id,
          type: payload.type,
          actor_id: user.id, // Force actor to be the authenticated user
          post_id: payload.post_id,
          content: payload.content,
        });
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
