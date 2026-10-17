import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { name, category, location, description, owner_name, owner_email } = await req.json();

    if (!name?.trim()) {
      return new Response(JSON.stringify({ error: 'Business name is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. SECURITY FIX: Force owner_id to be the authenticated user
    const owner_id = user.id;

    const base = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
    const suffix = Math.random().toString(36).substring(2, 6);
    const slug = `${base}-${suffix}`;

    const settings = {
      location: location?.trim() || null,
      description: description?.trim() || null,
      qr_payload: `mtaa://shop/${slug}`,
      created_via: 'app',
    };

    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .insert({
        name: name.trim(),
        slug,
        category: category || 'retail',
        verification_status: 'unverified',
        status: 'under_review',
        owner_id,
        settings,
      })
      .select()
      .single();

    if (shopErr) {
      console.error('[shop-create] Shop insert error:', shopErr);
      return new Response(JSON.stringify({ error: shopErr.message, detail: 'Failed to create shop' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: staffErr } = await supabase
      .from('shop_staff')
      .insert({
        shop_id: shop.id,
        user_id: owner_id,
        role: 'owner',
        name: owner_name || owner_email?.split('@')[0] || 'Owner',
        is_active: true,
      });

    if (staffErr) console.error('[shop-create] Staff insert error:', staffErr);

    return new Response(JSON.stringify({ success: true, shop }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('[shop-create] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
