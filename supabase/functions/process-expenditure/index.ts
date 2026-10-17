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

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. STRICT AUTHORIZATION CHECK: Verify user is 'owner' or 'admin'
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found', code: 'UNAUTHORIZED' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only 'owner' or 'admin' can process treasury expenditures
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Insufficient privileges to access treasury', code: 'FORBIDDEN' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { expenditure_id, action } = await req.json();
    
    // Force authorized_by to be the authenticated admin/owner
    const authorized_by = user.id;

    if (!expenditure_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing expenditure_id or action', code: 'INVALID_REQUEST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: exp, error: expErr } = await supabaseAdmin
      .from("treasury_expenditures")
      .select("*, treasury_budgets(available_amount, spent_amount, budget_code, id), treasury_accounts(current_balance, budget_utilized, id)")
      .eq("id", expenditure_id)
      .single();

    if (expErr || !exp) {
      return new Response(JSON.stringify({ error: "Expenditure not found" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === "approve") {
      if (exp.net_amount > (exp.treasury_budgets?.available_amount || 0)) {
        return new Response(JSON.stringify({ error: "Insufficient budget allocation" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabaseAdmin.from("treasury_expenditures").update({ payment_status: "approved", approved_by: authorized_by, approved_at: new Date().toISOString() }).eq("id", expenditure_id);
      await supabaseAdmin.from("treasury_budgets").update({ committed_amount: (exp.treasury_budgets?.committed_amount || 0) + exp.net_amount, available_amount: (exp.treasury_budgets?.available_amount || 0) - exp.net_amount }).eq("id", exp.budget_id);
    } else if (action === "authorize") {
      await supabaseAdmin.from("treasury_expenditures").update({ payment_status: "authorized", authorized_by: authorized_by, authorized_at: new Date().toISOString() }).eq("id", expenditure_id);
      await supabaseAdmin.from("treasury_budgets").update({ spent_amount: (exp.treasury_budgets?.spent_amount || 0) + exp.net_amount, committed_amount: (exp.treasury_budgets?.committed_amount || 0) - exp.net_amount }).eq("id", exp.budget_id);
      await supabaseAdmin.from("treasury_accounts").update({ current_balance: (exp.treasury_accounts?.current_balance || 0) - exp.net_amount, budget_utilized: (exp.treasury_accounts?.budget_utilized || 0) + exp.net_amount }).eq("id", exp.account_id);
    } else if (action === "pay") {
      await supabaseAdmin.from("treasury_expenditures").update({ payment_status: "paid", cleared_at: new Date().toISOString() }).eq("id", expenditure_id);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, expenditure_id, action }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
