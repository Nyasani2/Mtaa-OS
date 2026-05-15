import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient((globalThis as any).Deno?.env?.get('SUPABASE_URL')!, (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket');
    const userId = url.searchParams.get('userId');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    if (!bucket) return new Response(JSON.stringify({ error: 'Bucket required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    let query = supabase.from('storage_files').select('*').eq('bucket_id', bucket).is('deleted_at', null).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (userId) query = query.eq('owner_id', userId);
    if (search) query = query.ilike('filename', `%${search}%`);
    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ data, count: data?.length || 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
