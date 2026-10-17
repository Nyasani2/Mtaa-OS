import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { action, connected_profile_id } = await req.json();
    
    // 2. SECURITY FIX: Force follower to be the authenticated user
    const profile_id = user.id;

    if (action === 'follow') {
      await supabaseAdmin.from('profile_connections').upsert({
        profile_id, connected_profile_id, connection_type: 'follow', status: 'active', initiated_by: profile_id,
      }, { onConflict: 'profile_id,connected_profile_id' });
      await supabaseAdmin.rpc('sync_profile_follower_counts', { p_profile_id: connected_profile_id }).catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (action === 'unfollow') {
      await supabaseAdmin.from('profile_connections').delete().eq('profile_id', profile_id).eq('connected_profile_id', connected_profile_id).eq('connection_type', 'follow');
      await supabaseAdmin.rpc('sync_profile_follower_counts', { p_profile_id: connected_profile_id }).catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
