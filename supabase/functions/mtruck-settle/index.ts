import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ─── SECURITY: Centralized Treasury & Tax IDs ───
const TREASURY_USER_ID = Deno.env.get('TREASURY_USER_ID') || '8e41ee2e-ae74-43a5-a550-a1d02a5591a3';
const TAX_AUTHORITY_ID = Deno.env.get('FALLBACK_TAX_USER_ID') || '8e41ee2e-ae74-43a5-a550-a1d02a5591a3';

// ─── SECURITY: Service Role Client for Settlement ───
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
serve(async (req) => {
  try {
    const { job_id, final_rate } = await req.json()
    // ─── SECURITY: Verify Caller Identity ───
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: corsHeaders });
    }
    const caller_id = user.id;

    
    

    const { data: job, error: jobErr } = await supabase.from("mtruck_jobs").select("id, shipper_id, assigned_driver_id, status, final_rate, quoted_rate, currency, completed_at").eq("id", job_id).single();
    if (jobErr || !job) return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });
    if (job.status === "completed") return new Response(JSON.stringify({ error: "Already completed" }), { status: 409 });

    const rate = Number(final_rate ?? job.quoted_rate ?? 0);
    if (rate <= 0) return new Response(JSON.stringify({ error: "No valid rate" }), { status: 400 });

    const feePercent = 2, taxPercent = 5;
    const platformFee = Math.round(rate * (feePercent / 100) * 100) / 100;
    const taxWithheld = Math.round(rate * (taxPercent / 100) * 100) / 100;
    const driverAmount = Math.round((rate - platformFee - taxWithheld) * 100) / 100;
    const currency = job.currency || "KES";

    await supabase.from("mtruck_jobs").update({ status: "completed", completed_at: new Date().toISOString(), final_rate: rate }).eq("id", job_id);

    const { data: driverTxId, error: driverErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
      p_user_id: job.assigned_driver_id, p_amount: driverAmount, p_transaction_type: "mtruck_job_earnings",
      p_status: "completed", p_currency: currency, p_description: `Job earnings for job ${job_id}`,
      p_reference_type: "mtruck_job", p_reference_id: job_id, p_provider: "mtruck", p_metadata: { rate, platform_fee: platformFee },
    });
    if (driverErr) return new Response(JSON.stringify({ error: `Failed to credit driver: ${driverErr.message}` }), { status: 500 });

    let platformTxId = null, taxTxId = null;
    if (platformFee > 0) {
      const { data: pw } = await supabase.from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%MTAA%").maybeSingle();
      if (pw?.user_id) {
        const { data: txId } = await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: pw.user_id, p_amount: platformFee, p_transaction_type: "platform_fee",
          p_status: "completed", p_currency: currency, p_description: `Platform fee for job ${job_id}`,
          p_reference_type: "mtruck_job", p_reference_id: job_id, p_provider: "mtruck", p_metadata: { rate },
        });
        platformTxId = txId;
      }
    }
    if (taxWithheld > 0) {
      const { data: tw } = await supabase.from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%Government Tax%").maybeSingle();
      if (tw?.user_id) {
        const { data: txId } = await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: tw.user_id, p_amount: taxWithheld, p_transaction_type: "government_tax_withholding",
          p_status: "completed", p_currency: currency, p_description: `Withholding tax for job ${job_id}`,
          p_reference_type: "mtruck_job", p_reference_id: job_id, p_provider: "mtruck", p_metadata: { rate, tax_percent: taxPercent, country: "KE" },
        });
        taxTxId = txId;
      }
    }

    return new Response(JSON.stringify({
      success: true, final_rate: rate, driver_amount: driverAmount, platform_fee: platformFee,
      tax_withheld: taxWithheld, driver_transaction_id: driverTxId,
      platform_transaction_id: platformTxId, tax_transaction_id: taxTxId,
    }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500 });
  }
});