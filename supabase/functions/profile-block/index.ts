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

    const { action, blocked_profile_id, reason } = await req.json();
    
    // 2. SECURITY FIX: Force blocker to be the authenticated user
    const blocker_profile_id = user.id;

    if (action === 'block') {
      await supabaseAdmin.from('profile_blocks').insert({ blocker_profile_id, blocked_profile_id, reason });
      await supabaseAdmin.from('profile_connections').delete()
        .or(`and(profile_id.eq.${blocker_profile_id},connected_profile_id.eq.${blocked_profile_id}),and(profile_id.eq.${blocked_profile_id},connected_profile_id.eq.${blocker_profile_id})`);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (action === 'unblock') {
      await supabaseAdmin.from('profile_blocks').delete().eq('blocker_profile_id', blocker_profile_id).eq('blocked_profile_id', blocked_profile_id);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
