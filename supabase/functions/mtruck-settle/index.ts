// supabase/functions/mtruck-settle/index.ts
//
// Settles a completed mtruck_jobs freight job: credits the assigned
// driver's real wallet balance (final_rate minus platform fee) and
// credits MTAA's platform revenue wallet with its fee — both via the
// audited mtaa_add_wallet_transaction RPC, so every credit is logged
// in wallet_transactions, not just a status flip.
//
// Built 2026-07-17 to close a confirmed gap: no path anywhere in the
// app could actually pay a driver for a completed haul.
//
// IMPORTANT — table choice: this operates on `mtruck_jobs` (the table
// the live app screens actually read via lib/mtruck/services/shipper-service.ts
// and useShipperStore), NOT `mtruck_shipments` / `mtruck_freight_settlements`.
// An earlier draft of this function was built against the latter before
// verifying which table the real screens use — mtruck_shipments/
// mtruck_freight_settlements appear to be a separate, currently-unused
// schema (zero rows found, no frontend code reads them). If that table
// pair turns out to be intended for a different flow (e.g. bulk/enterprise
// freight vs. this on-demand haul-request flow), it needs its own,
// separate settlement function — not silently merged with this one.
//
// Also deliberately does NOT repeat two bugs found in mtaxi-complete
// during today's audit: (1) calculating a platform commission but never
// actually crediting it anywhere, and (2) only updating a stats field
// instead of the driver's real, spendable wallet balance.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { job_id, platform_fee_percent } = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: job, error: jobErr } = await supabase
      .from("mtruck_jobs")
      .select("id, shipper_id, assigned_driver_id, status, final_rate, quoted_rate, currency, completed_at")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });
    }

    if (user.id !== job.shipper_id && user.id !== job.assigned_driver_id) {
      return new Response(JSON.stringify({ error: "Not authorized to settle this job" }), { status: 403 });
    }

    if (!job.assigned_driver_id) {
      return new Response(JSON.stringify({ error: "Job has no assigned driver yet" }), { status: 400 });
    }

    if (job.status !== "delivered" && job.status !== "completed") {
      return new Response(JSON.stringify({ error: `Job status is '${job.status}' — must be 'delivered' before settlement` }), { status: 400 });
    }

    if (job.status === "completed" && job.completed_at) {
      return new Response(JSON.stringify({ error: "This job has already been settled" }), { status: 409 });
    }

    const rate = Number(job.final_rate ?? job.quoted_rate ?? 0);
    if (rate <= 0) {
      return new Response(JSON.stringify({ error: "Job has no valid rate to settle" }), { status: 400 });
    }

    const feePercent = typeof platform_fee_percent === "number" ? platform_fee_percent : 15;
    const platformFee = Math.round(rate * (feePercent / 100) * 100) / 100;
    const driverAmount = Math.round((rate - platformFee) * 100) / 100;
    const currency = job.currency || "KES";

    // Credit the driver's real wallet.
    const { data: driverTxId, error: driverErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
      p_user_id: job.assigned_driver_id,
      p_amount: driverAmount,
      p_transaction_type: "freight_settlement",
      p_status: "completed",
      p_currency: currency,
      p_description: `Freight payment for job ${job_id}`,
      p_reference_type: "mtruck_job",
      p_reference_id: job_id,
      p_provider: "mtruck",
      p_metadata: { rate, platform_fee: platformFee, fee_percent: feePercent },
    });

    if (driverErr) {
      return new Response(JSON.stringify({ error: `Failed to credit driver: ${driverErr.message}` }), { status: 500 });
    }

    // Credit MTAA's platform revenue wallet with its fee.
    let platformTxId: string | null = null;
    if (platformFee > 0) {
      const { data: platformWallet } = await supabase
        .from("wallets")
        .select("id, user_id")
        .eq("wallet_type", "main")
        .ilike("wallet_name", "%MTAA%")
        .maybeSingle();

      if (platformWallet?.user_id) {
        const { data: txId, error: platformErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: platformWallet.user_id,
          p_amount: platformFee,
          p_transaction_type: "platform_fee",
          p_status: "completed",
          p_currency: currency,
          p_description: `Platform fee for mtruck job ${job_id}`,
          p_reference_type: "mtruck_job",
          p_reference_id: job_id,
          p_provider: "mtruck",
          p_metadata: { rate },
        });
        if (!platformErr) platformTxId = txId;
      }
      // A missing platform wallet does not block the driver's payout —
      // that would punish a real person for a platform-side config gap.
      // It would show up in reconciliation instead.
    }

    const { error: updateErr } = await supabase
      .from("mtruck_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString(), final_rate: rate })
      .eq("id", job_id);

    if (updateErr) {
      return new Response(JSON.stringify({
        warning: "Payment was made but job status update failed — check job manually",
        error: updateErr.message,
        driver_transaction_id: driverTxId,
      }), { status: 207 });
    }

    return new Response(JSON.stringify({
      success: true,
      job_id,
      driver_amount: driverAmount,
      platform_fee: platformFee,
      driver_transaction_id: driverTxId,
      platform_transaction_id: platformTxId,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500 });
  }
});
