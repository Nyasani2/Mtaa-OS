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
    
    const authenticatedUserId = user.id
    const { taxpayer_id, return_id, amount, payment_method, wallet_id } = await req.json();

    if (taxpayer_id !== authenticatedUserId) {
       return new Response(JSON.stringify({ error: 'Unauthorized: You can only process payments for your own tax returns', code: 'UNAUTHORIZED' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: ret } = await supabaseAdmin.from("revenue_returns").select("*, revenue_taxpayers(country_code)").eq("id", return_id).single();
    if (!ret) return new Response(JSON.stringify({ error: "Return not found" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (ret.payment_status === "paid") return new Response(JSON.stringify({ error: "Already paid" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const country_code = ret.revenue_taxpayers?.country_code || "KE";

    const { data: payment, error: payErr } = await supabaseAdmin.from("revenue_payments").insert({
      country_code, taxpayer_id, return_id, tax_type: ret.tax_type, payment_method, wallet_id, amount, payment_status: "completed", processed_at: new Date().toISOString(), created_at: new Date().toISOString()
    }).select().single();

    if (payErr) return new Response(JSON.stringify({ error: payErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    await supabaseAdmin.from("revenue_returns").update({
      tax_paid: ret.tax_paid + amount,
      tax_due: Math.max(0, ret.tax_due - amount),
      payment_status: (ret.tax_paid + amount) >= ret.total_due ? "paid" : "partial",
      updated_at: new Date().toISOString()
    }).eq("id", return_id);

    await supabaseAdmin.from("revenue_taxpayers").update({
      penalty_balance: Math.max(0, (ret.penalty_amount || 0) - amount),
      updated_at: new Date().toISOString()
    }).eq("id", taxpayer_id);

    return new Response(JSON.stringify({ success: true, payment_id: payment.id, amount, status: "completed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
