import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { return_id, payment_method, wallet_id } = await req.json();

    // 1. Look up taxpayer by user_id
    const { data: taxpayer, error: taxpayerErr } = await supabaseAdmin
      .from('revenue_taxpayers')
      .select('id, country_code')
      .eq('user_id', user.id)
      .single();

    if (taxpayerErr || !taxpayer) {
      return new Response(JSON.stringify({ error: 'Taxpayer record not found for this user' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Verify return exists, belongs to THIS taxpayer, and is unpaid
    const { data: ret, error: retErr } = await supabaseAdmin
      .from('revenue_returns')
      .select('*, revenue_taxpayers(country_code)')
      .eq('id', return_id)
      .eq('taxpayer_id', taxpayer.id)
      .single();

    if (retErr || !ret) {
      return new Response(JSON.stringify({ error: 'Return not found or does not belong to you' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (ret.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Already paid' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Use the amount from the return, NOT the request body
    const amount = ret.tax_due;
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount due' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const country_code = taxpayer.country_code || 'KE';

    // 4. Create payment record
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('revenue_payments')
      .insert({
        country_code,
        taxpayer_id: taxpayer.id,
        return_id,
        tax_type: ret.tax_type,
        payment_method,
        wallet_id,
        amount,
        payment_status: 'completed',
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payErr) {
      return new Response(JSON.stringify({ error: payErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Update return status
    await supabaseAdmin
      .from('revenue_returns')
      .update({
        tax_paid: ret.tax_paid + amount,
        tax_due: Math.max(0, ret.tax_due - amount),
        payment_status: (ret.tax_paid + amount) >= ret.total_due ? 'paid' : 'partial',
        updated_at: new Date().toISOString()
      })
      .eq('id', return_id);

    // 6. Update taxpayer balance
    await supabaseAdmin
      .from('revenue_taxpayers')
      .update({
        penalty_balance: Math.max(0, (ret.penalty_amount || 0) - amount),
        updated_at: new Date().toISOString()
      })
      .eq('id', taxpayer.id);

    return new Response(
      JSON.stringify({ success: true, payment_id: payment.id, amount, status: 'completed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
