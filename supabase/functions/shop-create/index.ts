import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Service role client — bypasses ALL RLS, triggers, permissions
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const {
      name,
      category,
      location,
      description,
      owner_id,
      owner_name,
      owner_email,
    } = body

    if (!name?.trim() || !owner_id) {
      return new Response(
        JSON.stringify({ error: 'Business name and owner_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate slug
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    const suffix = Math.random().toString(36).substring(2, 6)
    const slug = `${base}-${suffix}`

    // Build settings JSONB
    const settings = {
      location: location?.trim() || null,
      description: description?.trim() || null,
      qr_payload: `mtaa://shop/${slug}`,
      created_via: 'app',
    }

    // Insert shop using service role (bypasses RLS + triggers)
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
      .single()

    if (shopErr) {
      console.error('[shop-create] Shop insert error:', shopErr)
      return new Response(
        JSON.stringify({ error: shopErr.message, detail: 'Failed to create shop' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert owner as shop_staff
    const { error: staffErr } = await supabase
      .from('shop_staff')
      .insert({
        shop_id: shop.id,
        user_id: owner_id,
        role: 'owner',
        name: owner_name || owner_email?.split('@')[0] || 'Owner',
        is_active: true,
      })

    if (staffErr) {
      console.error('[shop-create] Staff insert error:', staffErr)
      // Non-fatal — shop was created
    }

    return new Response(
      JSON.stringify({ success: true, shop }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[shop-create] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
