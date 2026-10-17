import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Verify Admin Role (Analytics are sensitive)
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only admins can view search analytics' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'popular') {
      const configKey = url.searchParams.get('config');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      let q = supabase.from('search_logs').select('query, count');
      if (configKey) q = q.eq('config_key', configKey);
      const { data, error } = await q.order('count', { ascending: false }).limit(limit);
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'stats') {
      const { count: total } = await supabase.from('search_logs').select('*', { count: 'exact', head: true });
      const { data: top } = await supabase.rpc('mtaa_search_top_queries', { p_limit: 10 });
      return new Response(JSON.stringify({ totalQueries: total || 0, topQueries: top || [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
