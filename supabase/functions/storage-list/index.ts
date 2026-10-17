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

    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket');
    const requestedUserId = url.searchParams.get('userId');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!bucket) return new Response(JSON.stringify({ error: 'Bucket required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Security Check: Users can only list their own files unless they are admin
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
    
    // Force userId to be the authenticated user unless they are admin
    const filterUserId = isAdmin ? (requestedUserId || user.id) : user.id;

    let query = supabase.from('storage_files').select('*').eq('bucket_id', bucket).eq('owner_id', filterUserId).is('deleted_at', null).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (search) query = query.ilike('filename', `%${search}%`);
    
    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ data, count: data?.length || 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
