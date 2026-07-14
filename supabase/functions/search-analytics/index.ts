import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient((globalThis as any).Deno?.env?.get('SUPABASE_URL')!, (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!);
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
      const { data: total } = await supabase.from('search_logs').select('*', { count: 'exact', head: true });
      const { data: avg } = await supabase.rpc('mtaa_search_avg_results');
      const { data: top } = await supabase.rpc('mtaa_search_top_queries', { p_limit: 10 });
      const { data: zero } = await supabase.from('search_logs').select('query').eq('results_count', 0).limit(20);
      return new Response(JSON.stringify({
        totalQueries: total?.length || 0,
        avgResults: avg || 0,
        topQueries: top || [],
        zeroResultQueries: zero?.map(z => z.query) || [],
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'zero-results') {
      const { data, error } = await supabase.from('search_logs')
        .select('query, config_key, created_at')
        .eq('results_count', 0)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use: popular, stats, zero-results' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
