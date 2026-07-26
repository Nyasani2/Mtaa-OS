import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient((globalThis as any).Deno?.env?.get('SUPABASE_URL') || '', (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'private-files';
    const pathPrefix = formData.get('pathPrefix') as string || `users/${user.id}`;
    const metadataStr = formData.get('metadata') as string || '{}';
    if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: quota } = await supabase.from('storage_quotas').select('total_bytes').eq('user_id', user.id).single();
    const { data: usage } = await supabase.from('storage_files').select('size').eq('owner_id', user.id);
    const usedBytes = usage?.reduce((sum, f) => sum + (f.size || 0), 0) || 0;
    const totalBytes = quota?.total_bytes || 1073741824;
    if (usedBytes + file.size > totalBytes) return new Response(JSON.stringify({ error: 'Storage quota exceeded' }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${pathPrefix}/${timestamp}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (uploadError) return new Response(JSON.stringify({ error: uploadError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const fileId = crypto.randomUUID();
    const { error: dbError } = await supabase.from('storage_files').insert({
      id: fileId, bucket_id: bucket, path, filename: file.name, size: file.size, mime_type: file.type,
      owner_id: user.id, public_url: publicUrl, metadata: JSON.parse(metadataStr),
      is_public: bucket === 'public-assets' || bucket === 'user-avatars' || bucket === 'media-streams',
      virus_scanned: false, scan_status: 'pending',
    });
    if (dbError) { await supabase.storage.from(bucket).remove([path]); return new Response(JSON.stringify({ error: dbError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    await supabase.functions.invoke('storage-scan', { body: { fileId, bucket, path } }).catch(() => {});
    return new Response(JSON.stringify({ success: true, fileId, path, publicUrl, size: file.size, mimeType: file.type }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});