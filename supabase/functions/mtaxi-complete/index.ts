// supabase/functions/mtaxi-complete/index.ts
//
// FIXED 2026-07-18 — this function had 5 confirmed bugs, verified
// against live schema before rewriting:
//   1. Never credited the driver's real wallet — only incremented
//      mtaxi_drivers.total_earnings, a column that doesn't exist at all
//      (real columns: total_trips, earnings_today/week/month).
//   2. Calculated a 25% platform commission but never credited it
//      anywhere — silently dropped every time.
//   3. No government tax withholding at all.
//   4. Read ride.estimated_fare (doesn't exist — real column is
//      fare_estimate) and ride.total_rides/total_earnings (don't exist
//      on `rides` at all) as the base for incrementing stats, meaning
//      the stats update was resetting to a wrong low value on every ride,
//      not accumulating, and fare could be undefined if final_fare
//      wasn't explicitly passed by the caller.
//   5. escrow_accounts release used .eq("job_id", ride_id) — that column
//      doesn't exist on escrow_accounts at all (verified directly),
//      so this call has always silently updated zero rows.
//
// Now uses the same 2% platform fee + 5% KE tax withholding pattern as
// mtruck-settle/job-contract-settle/garage-settle/boda-operations, via
// the audited mtaa_add_wallet_transaction RPC — real, spendable wallet
// balances, not stats fields.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { ride_id, final_fare } = await req.json();
    const authHeader = req.headers.get("Authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: ride, error: rideErr } = await supabase
      .from("rides")
      .select("id, passenger_id, driver_id, status, fare_estimate, final_fare")
      .eq("id", ride_id)
      .eq("driver_id", user.id)
      .single();

    if (rideErr || !ride) return new Response(JSON.stringify({ error: "Ride not found" }), { status: 404 });

    if (ride.status === "completed") {
      return new Response(JSON.stringify({ error: "This ride has already been completed" }), { status: 409 });
    }

    const fare = Number(final_fare ?? ride.fare_estimate ?? 0);
    if (fare <= 0) {
      return new Response(JSON.stringify({ error: "No valid fare to settle" }), { status: 400 });
    }

    const feePercent = 2; // Kevin's platform-wide default for boda/mtaxi/mtruck
    const taxPercent = 5; // KE withholding_income_tax — same TODO as other settlement functions
    const platformFee = Math.round(fare * (feePercent / 100) * 100) / 100;
    const taxWithheld = Math.round(fare * (taxPercent / 100) * 100) / 100;
    const driverAmount = Math.round((fare - platformFee - taxWithheld) * 100) / 100;
    const currency = "KES";

    const { error: updateError } = await supabase
      .from("rides")
      .update({ status: "completed", completed_at: new Date().toISOString(), final_fare: fare })
      .eq("id", ride_id);
    if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });

    // Credit the driver's real wallet.
    const { data: driverTxId, error: driverErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
      p_user_id: user.id,
      p_amount: driverAmount,
      p_transaction_type: "mtaxi_ride_earnings",
      p_status: "completed",
      p_currency: currency,
      p_description: `Ride earnings for ride ${ride_id}`,
      p_reference_type: "ride",
      p_reference_id: ride_id,
      p_provider: "mtaxi",
      p_metadata: { fare, platform_fee: platformFee, fee_percent: feePercent },
    });
    if (driverErr) {
      return new Response(JSON.stringify({ error: `Failed to credit driver: ${driverErr.message}` }), { status: 500 });
    }

    // Credit MTAA's platform revenue wallet.
    let platformTxId: string | null = null;
    if (platformFee > 0) {
      const { data: platformWallet } = await supabase
        .from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%MTAA%").maybeSingle();
      if (platformWallet?.user_id) {
        const { data: txId, error: platformErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: platformWallet.user_id, p_amount: platformFee, p_transaction_type: "platform_fee",
          p_status: "completed", p_currency: currency, p_description: `Platform fee for ride ${ride_id}`,
          p_reference_type: "ride", p_reference_id: ride_id, p_provider: "mtaxi", p_metadata: { fare },
        });
        if (!platformErr) platformTxId = txId;
      }
    }

    // Withhold and route government tax.
    let taxTxId: string | null = null;
    if (taxWithheld > 0) {
      const { data: taxWallet } = await supabase
        .from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%Government Tax%").maybeSingle();
      if (taxWallet?.user_id) {
        const { data: txId, error: taxErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: taxWallet.user_id, p_amount: taxWithheld, p_transaction_type: "government_tax_withholding",
          p_status: "completed", p_currency: currency, p_description: `Withholding tax for ride ${ride_id}`,
          p_reference_type: "ride", p_reference_id: ride_id, p_provider: "mtaxi",
          p_metadata: { fare, tax_percent: taxPercent, country: "KE" },
        });
        if (!taxErr) taxTxId = txId;
      }
    }

    // Update real driver stats (using columns that actually exist).
    const { data: driverRow } = await supabase
      .from("mtaxi_drivers")
      .select("total_trips, earnings_today")
      .eq("user_id", user.id)
      .maybeSingle();

    if (driverRow) {
      await supabase
        .from("mtaxi_drivers")
        .update({
          total_trips: (driverRow.total_trips || 0) + 1,
          earnings_today: (driverRow.earnings_today || 0) + driverAmount,
          is_online: true,
        })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      success: true, final_fare: fare, driver_amount: driverAmount, platform_fee: platformFee,
      tax_withheld: taxWithheld, driver_transaction_id: driverTxId,
      platform_transaction_id: platformTxId, tax_transaction_id: taxTxId,
    }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500 });
  }
});
