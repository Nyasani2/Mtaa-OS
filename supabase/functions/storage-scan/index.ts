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

    const { fileId, bucket, path } = await req.json();
    if (!fileId || !bucket || !path) return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Verify file ownership
    const { data: fileRecord, error: fileError } = await supabase.from('storage_files').select('owner_id').eq('id', fileId).single();
    if (fileError || !fileRecord) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
    
    if (fileRecord.owner_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized to scan this file' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Perform scan (simplified logic)
    const { data: fileData, error: downloadError } = await supabase.storage.from(bucket).download(path);
    if (downloadError) {
      await supabase.from('storage_files').update({ scan_status: 'error', virus_scanned: false }).eq('id', fileId);
      throw downloadError;
    }

    const buffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let isClean = true;
    
    // Basic magic number checks
    const exeMagic = [0x4D, 0x5A]; const elfMagic = [0x7F, 0x45, 0x4C, 0x46];
    if (bytes.length >= 2 && bytes[0] === exeMagic[0] && bytes[1] === exeMagic[1]) isClean = false;
    if (bytes.length >= 4 && bytes[0] === elfMagic[0] && bytes[1] === elfMagic[1]) isClean = false;

    await supabase.from('storage_files').update({ 
      virus_scanned: true, 
      scan_status: isClean ? 'clean' : 'infected', 
      metadata: { type: 'scanned', checked_at: new Date().toISOString() } 
    }).eq('id', fileId);

    return new Response(JSON.stringify({ fileId, status: isClean ? 'clean' : 'infected' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
