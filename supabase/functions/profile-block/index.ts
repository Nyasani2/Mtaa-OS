import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { action, blocker_profile_id, blocked_profile_id, reason } = await req.json();

  if (action === 'block') {
    await supabase.from('profile_blocks').insert({ blocker_profile_id, blocked_profile_id, reason });
    // Also remove any follow connection
    await supabase.from('profile_connections').delete()
      .or(`and(profile_id.eq.${blocker_profile_id},connected_profile_id.eq.${blocked_profile_id}),and(profile_id.eq.${blocked_profile_id},connected_profile_id.eq.${blocker_profile_id})`);
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'unblock') {
    await supabase.from('profile_blocks').delete().eq('blocker_profile_id', blocker_profile_id).eq('blocked_profile_id', blocked_profile_id);
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
});
