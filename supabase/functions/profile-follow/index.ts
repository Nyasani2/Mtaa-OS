import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { action, profile_id, connected_profile_id } = await req.json();

  if (action === 'follow') {
    await supabase.from('profile_connections').upsert({
      profile_id, connected_profile_id, connection_type: 'follow', status: 'active', initiated_by: profile_id,
    }, { onConflict: 'profile_id,connected_profile_id' });
    await supabase.rpc('sync_profile_follower_counts', { p_profile_id: connected_profile_id });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'unfollow') {
    await supabase.from('profile_connections').delete().eq('profile_id', profile_id).eq('connected_profile_id', connected_profile_id).eq('connection_type', 'follow');
    await supabase.rpc('sync_profile_follower_counts', { p_profile_id: connected_profile_id });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
});
