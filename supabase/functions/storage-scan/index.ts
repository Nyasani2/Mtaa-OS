import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient((globalThis as any).Deno?.env?.get('SUPABASE_URL') || '', (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { fileId, bucket, path } = await req.json();
    if (!fileId || !bucket || !path) return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: fileData, error: downloadError } = await supabase.storage.from(bucket).download(path);
    if (downloadError) { await supabase.from('storage_files').update({ scan_status: 'error', virus_scanned: false }).eq('id', fileId); throw downloadError; }
    const buffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let isClean = true;
    const suspiciousExtensions = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.php'];
    const lowerPath = path.toLowerCase();
    for (const ext of suspiciousExtensions) { if (lowerPath.endsWith(ext)) { isClean = false; break; } }
    const exeMagic = [0x4D, 0x5A]; const elfMagic = [0x7F, 0x45, 0x4C, 0x46];
    if (bytes.length >= 2 && bytes[0] === exeMagic[0] && bytes[1] === exeMagic[1]) isClean = false;
    if (bytes.length >= 4 && bytes[0] === elfMagic[0] && bytes[1] === elfMagic[1]) isClean = false;
    let extractedMetadata = {};
    if (path.match(/\.(jpg|jpeg|png|webp|gif)$/i)) extractedMetadata = { type: 'image', scanned: true, width: null, height: null };
    else if (path.match(/\.(mp4|webm|mov|avi)$/i)) extractedMetadata = { type: 'video', scanned: true, duration: null };
    else if (path.match(/\.(pdf)$/i)) extractedMetadata = { type: 'document', scanned: true, pages: null };
    else extractedMetadata = { type: 'unknown', scanned: true };
    await supabase.from('storage_files').update({ virus_scanned: true, scan_status: isClean ? 'clean' : 'infected', metadata: extractedMetadata }).eq('id', fileId);
    return new Response(JSON.stringify({ fileId, status: isClean ? 'clean' : 'infected', metadata: extractedMetadata }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});