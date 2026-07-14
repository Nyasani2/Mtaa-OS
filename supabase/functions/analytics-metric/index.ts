import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient((globalThis as any).Deno?.env?.get('SUPABASE_URL')!, (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { table, aggregation, column, filter, group_by, interval, start, end } = await req.json();

    if (!table || !aggregation) {
      return new Response(JSON.stringify({ error: 'table and aggregation required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('mtaa_get_metric', {
      p_table: table,
      p_aggregation: aggregation,
      p_column: column || 'id',
      p_filter: filter || {},
      p_group_by: group_by || null,
      p_interval: interval || 'day',
      p_start: start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_end: end || new Date().toISOString(),
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
