// supabase/functions/job-contract-settle/index.ts
//
// Settles a completed freelance job_contracts row: credits the worker's
// real wallet balance (agreed_amount minus 2% platform fee minus
// government tax withholding) and credits both MTAA's platform revenue
// wallet and the government tax wallet — all via the audited
// mtaa_add_wallet_transaction RPC, so every credit is logged in
// wallet_transactions, not just a status flip.
//
// Built 2026-07-18 to close a confirmed gap: app/(work)/jobs/freelance/index.tsx
// (PROJECTS, MILESTONES, MY_CONTRACTS) was entirely hardcoded mock data
// with zero backend connection — no way for a freelancer to actually get
// paid existed anywhere. job_contracts (employer_id, worker_id,
// agreed_amount, status) is the real, matching table, verified to exist
// with zero rows (pre-launch) before building against it.
//
// Same fee structure as mtruck-settle: 2% platform fee (per Kevin's
// instruction), plus government tax withholding hardcoded to Kenya's 5%
// withholding_income_tax rate pending per-country lookup once worker
// country is tracked.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { contract_id, platform_fee_percent } = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!contract_id) {
      return new Response(JSON.stringify({ error: "contract_id is required" }), { status: 400 });
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

    const { data: contract, error: contractErr } = await supabase
      .from("job_contracts")
      .select("id, job_id, employer_id, worker_id, agreed_amount, status")
      .eq("id", contract_id)
      .single();

    if (contractErr || !contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
    }

    if (user.id !== contract.employer_id && user.id !== contract.worker_id) {
      return new Response(JSON.stringify({ error: "Not authorized to settle this contract" }), { status: 403 });
    }

    if (!contract.worker_id) {
      return new Response(JSON.stringify({ error: "Contract has no assigned worker" }), { status: 400 });
    }

    if (contract.status === "completed") {
      return new Response(JSON.stringify({ error: "This contract has already been settled" }), { status: 409 });
    }

    if (contract.status !== "active" && contract.status !== "delivered") {
      return new Response(JSON.stringify({ error: `Contract status is '${contract.status}' — must be 'active' or 'delivered' before settlement` }), { status: 400 });
    }

    const amount = Number(contract.agreed_amount ?? 0);
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: "Contract has no valid agreed_amount to settle" }), { status: 400 });
    }

    const feePercent = typeof platform_fee_percent === "number" ? platform_fee_percent : 2;
    const taxPercent = 5; // KE withholding_income_tax — same TODO as mtruck-settle: look up per-country once worker country is tracked
    const platformFee = Math.round(amount * (feePercent / 100) * 100) / 100;
    const taxWithheld = Math.round(amount * (taxPercent / 100) * 100) / 100;
    const workerAmount = Math.round((amount - platformFee - taxWithheld) * 100) / 100;
    const currency = "KES";

    if (workerAmount <= 0) {
      return new Response(JSON.stringify({ error: "Calculated worker payout is zero or negative — check contract amount" }), { status: 400 });
    }

    // Credit the worker's real wallet.
    const { data: workerTxId, error: workerErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
      p_user_id: contract.worker_id,
      p_amount: workerAmount,
      p_transaction_type: "freelance_settlement",
      p_status: "completed",
      p_currency: currency,
      p_description: `Freelance contract payment for job ${contract.job_id}`,
      p_reference_type: "job_contract",
      p_reference_id: contract_id,
      p_provider: "jobs",
      p_metadata: { amount, platform_fee: platformFee, fee_percent: feePercent },
    });

    if (workerErr) {
      return new Response(JSON.stringify({ error: `Failed to credit worker: ${workerErr.message}` }), { status: 500 });
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
          p_description: `Platform fee for job contract ${contract_id}`,
          p_reference_type: "job_contract",
          p_reference_id: contract_id,
          p_provider: "jobs",
          p_metadata: { amount },
        });
        if (!platformErr) platformTxId = txId;
      }
    }

    // Withhold and route government tax.
    let taxTxId: string | null = null;
    if (taxWithheld > 0) {
      const { data: taxWallet } = await supabase
        .from("wallets")
        .select("id, user_id")
        .eq("wallet_type", "main")
        .ilike("wallet_name", "%Government Tax%")
        .maybeSingle();

      if (taxWallet?.user_id) {
        const { data: txId, error: taxErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: taxWallet.user_id,
          p_amount: taxWithheld,
          p_transaction_type: "government_tax_withholding",
          p_status: "completed",
          p_currency: currency,
          p_description: `Withholding tax for job contract ${contract_id}`,
          p_reference_type: "job_contract",
          p_reference_id: contract_id,
          p_provider: "jobs",
          p_metadata: { amount, tax_percent: taxPercent, country: "KE" },
        });
        if (!taxErr) taxTxId = txId;
      }
    }

    const { error: updateErr } = await supabase
      .from("job_contracts")
      .update({ status: "completed" })
      .eq("id", contract_id);

    if (updateErr) {
      return new Response(JSON.stringify({
        warning: "Payment was made but contract status update failed — check contract manually",
        error: updateErr.message,
        worker_transaction_id: workerTxId,
      }), { status: 207 });
    }

    return new Response(JSON.stringify({
      success: true,
      contract_id,
      worker_amount: workerAmount,
      platform_fee: platformFee,
      tax_withheld: taxWithheld,
      worker_transaction_id: workerTxId,
      platform_transaction_id: platformTxId,
      tax_transaction_id: taxTxId,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500 });
  }
});
