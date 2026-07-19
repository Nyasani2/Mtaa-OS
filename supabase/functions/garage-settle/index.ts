// supabase/functions/garage-settle/index.ts
//
// Settles a completed garage_appointments repair job: DEBITS the
// customer's real wallet balance for the final cost, then CREDITS the
// garage owner's real wallet (minus platform fee and government tax
// withholding) and MTAA's platform revenue + tax wallets — all via the
// audited mtaa_add_wallet_transaction RPC.
//
// Built 2026-07-18 to close a confirmed gap: garage.service.ts had
// zero function that could actually collect payment for a repair —
// only registration, listing, stats-reading, and garage subscription
// billing existed. garage_appointments/garage_invoices are real,
// well-designed tables (final_cost, payment_status, wallet_transaction_id,
// invoice_id already present) — the schema anticipated this, the
// function to execute it just didn't exist.
//
// IMPORTANT — this is structurally different from mtruck-settle and
// job-contract-settle: those distribute an amount assumed to already be
// collected. This one is a genuine payment COLLECTION: the customer's
// wallet is actually debited here. mtaa_add_wallet_transaction does
// NOT check for sufficient balance before debiting (verified by reading
// its source — it will happily push a wallet negative), so this
// function does its own balance check before attempting the debit.
//
// Respects garages.commission_rate if set (the schema already has a
// per-garage commission field) rather than hardcoding a single rate for
// every garage; falls back to 2% (Kevin's platform-wide default) if unset.
// Also withholds government tax same as mtruck/jobs — hardcoded to
// Kenya's 5% withholding_income_tax pending per-country lookup.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { appointment_id } = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!appointment_id) {
      return new Response(JSON.stringify({ error: "appointment_id is required" }), { status: 400 });
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

    const { data: appt, error: apptErr } = await supabase
      .from("garage_appointments")
      .select("id, garage_id, customer_id, final_cost, estimated_cost, status, payment_status")
      .eq("id", appointment_id)
      .single();

    if (apptErr || !appt) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), { status: 404 });
    }

    const { data: garage, error: garageErr } = await supabase
      .from("garages")
      .select("id, owner_id, commission_rate")
      .eq("id", appt.garage_id)
      .single();

    if (garageErr || !garage) {
      return new Response(JSON.stringify({ error: "Garage not found" }), { status: 404 });
    }

    if (user.id !== garage.owner_id && user.id !== appt.customer_id) {
      return new Response(JSON.stringify({ error: "Not authorized to settle this appointment" }), { status: 403 });
    }

    if (appt.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "This appointment has already been paid" }), { status: 409 });
    }

    if (!["ready_for_pickup", "completed"].includes(appt.status)) {
      return new Response(JSON.stringify({ error: `Appointment status is '${appt.status}' — must be 'ready_for_pickup' or 'completed' before payment` }), { status: 400 });
    }

    const amount = Number(appt.final_cost ?? appt.estimated_cost ?? 0);
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: "Appointment has no valid cost to settle" }), { status: 400 });
    }

    // Explicit balance check — mtaa_add_wallet_transaction does not
    // guard against over-debiting, verified before writing this.
    const { data: customerWallet, error: custWalletErr } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", appt.customer_id)
      .maybeSingle();

    if (custWalletErr || !customerWallet) {
      return new Response(JSON.stringify({ error: "Customer has no wallet on record" }), { status: 400 });
    }
    if (Number(customerWallet.balance) < amount) {
      return new Response(JSON.stringify({ error: "Insufficient customer wallet balance" }), { status: 400 });
    }

    const feePercent = garage.commission_rate != null ? Number(garage.commission_rate) : 2;
    const taxPercent = 5; // KE withholding_income_tax — same TODO as mtruck/jobs
    const platformFee = Math.round(amount * (feePercent / 100) * 100) / 100;
    const taxWithheld = Math.round(amount * (taxPercent / 100) * 100) / 100;
    const garageAmount = Math.round((amount - platformFee - taxWithheld) * 100) / 100;
    const currency = "KES";

    if (garageAmount <= 0) {
      return new Response(JSON.stringify({ error: "Calculated garage payout is zero or negative — check appointment cost and commission rate" }), { status: 400 });
    }

    // Debit the customer.
    const { data: debitTxId, error: debitErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
      p_user_id: appt.customer_id,
      p_amount: -amount,
      p_transaction_type: "garage_service_payment",
      p_status: "completed",
      p_currency: currency,
      p_description: `Garage service payment for appointment ${appointment_id}`,
      p_reference_type: "garage_appointment",
      p_reference_id: appointment_id,
      p_provider: "garage",
      p_metadata: { amount, garage_id: garage.id },
    });

    if (debitErr) {
      return new Response(JSON.stringify({ error: `Failed to charge customer: ${debitErr.message}` }), { status: 500 });
    }

    // Credit the garage owner.
    const { data: garageTxId, error: garageTxErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
      p_user_id: garage.owner_id,
      p_amount: garageAmount,
      p_transaction_type: "garage_service_earnings",
      p_status: "completed",
      p_currency: currency,
      p_description: `Repair payment for appointment ${appointment_id}`,
      p_reference_type: "garage_appointment",
      p_reference_id: appointment_id,
      p_provider: "garage",
      p_metadata: { amount, platform_fee: platformFee, fee_percent: feePercent },
    });

    if (garageTxErr) {
      // The customer has already been debited at this point. Not silently
      // swallowing this — surfacing it clearly so it can be reconciled,
      // since a partial failure here means real money is now unaccounted
      // for between the customer debit and the garage credit.
      return new Response(JSON.stringify({
        error: `Customer was charged but failed to credit garage: ${garageTxErr.message}`,
        requires_manual_reconciliation: true,
        customer_debit_transaction_id: debitTxId,
      }), { status: 500 });
    }

    // Credit MTAA's platform revenue wallet.
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
          p_description: `Platform fee for garage appointment ${appointment_id}`,
          p_reference_type: "garage_appointment",
          p_reference_id: appointment_id,
          p_provider: "garage",
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
          p_description: `Withholding tax for garage appointment ${appointment_id}`,
          p_reference_type: "garage_appointment",
          p_reference_id: appointment_id,
          p_provider: "garage",
          p_metadata: { amount, tax_percent: taxPercent, country: "KE" },
        });
        if (!taxErr) taxTxId = txId;
      }
    }

    const { error: updateErr } = await supabase
      .from("garage_appointments")
      .update({
        payment_status: "paid",
        wallet_transaction_id: garageTxId,
        final_cost: amount,
      })
      .eq("id", appointment_id);

    if (updateErr) {
      return new Response(JSON.stringify({
        warning: "Payment was made but appointment status update failed — check appointment manually",
        error: updateErr.message,
        garage_transaction_id: garageTxId,
      }), { status: 207 });
    }

    return new Response(JSON.stringify({
      success: true,
      appointment_id,
      amount_charged: amount,
      garage_amount: garageAmount,
      platform_fee: platformFee,
      tax_withheld: taxWithheld,
      customer_debit_transaction_id: debitTxId,
      garage_transaction_id: garageTxId,
      platform_transaction_id: platformTxId,
      tax_transaction_id: taxTxId,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500 });
  }
});
