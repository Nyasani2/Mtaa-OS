import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient((globalThis as any).Deno?.env?.get('SUPABASE_URL') || '', (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { table, query, columns, weights, facets, fuzzy, limit, offset, sort, order, facet_filters } = await req.json();

    if (!table || !query || !columns) {
      return new Response(JSON.stringify({ error: 'Missing required fields: table, query, columns' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('mtaa_search', {
      p_table: table,
      p_query: query,
      p_columns: columns,
      p_weights: weights || {},
      p_facets: facets || [],
      p_fuzzy: fuzzy ?? true,
      p_limit: limit || 20,
      p_offset: offset || 0,
      p_sort: sort || 'rank',
      p_order: order || 'desc',
      p_facet_filters: facet_filters || {},
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