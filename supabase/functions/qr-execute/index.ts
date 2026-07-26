import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { qr_code_id, action, scanner_id, amount, currency = "KES", description, metadata = {} } = body;

    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", qr_code_id)
      .single();

    if (qrError || !qrCode) {
      return new Response(
        JSON.stringify({ error: "QR code not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("qr_scans")
      .update({ action_taken: action, action_result: "pending" })
      .eq("qr_code_id", qr_code_id)
      .eq("scanner_id", scanner_id)
      .is("action_taken", null)
      .order("created_at", { ascending: false })
      .limit(1);

    let result: any = null;

    switch (action) {
      case "pay":
      case "pay_prefilled":
      case "pay_fare":
      case "pay_tax":
      case "pay_fee": {
        const payAmount = amount || qrCode.prefilled_amount;
        if (!payAmount) {
          return new Response(
            JSON.stringify({ error: "Amount required for payment" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: tx, error: txError } = await supabase
          .from("wallet_transactions")
          .insert({
            user_id: scanner_id,
            wallet_id: null,
            type: "debit",
            amount: payAmount,
            currency: currency || qrCode.prefilled_currency,
            status: "pending",
            description: description || qrCode.prefilled_description || `QR payment to ${qrCode.entity_type}`,
            reference_id: qrCode.entity_id,
            reference_type: qrCode.entity_type,
            metadata: {
              ...metadata,
              qr_code_id,
              recipient_id: qrCode.owner_id,
              action,
            },
          })
          .select()
          .single();

        if (txError) throw txError;
        result = { transaction: tx, next_step: "confirm_payment" };
        break;
      }

      case "request":
        result = { 
          type: "payment_request", 
          recipient_id: qrCode.owner_id,
          message: "Payment request sent" 
        };
        break;

      case "follow": {
        const { error: followError } = await supabase
          .from("follows")
          .upsert({
            follower_id: scanner_id,
            following_id: qrCode.owner_id,
          }, { onConflict: "follower_id,following_id" });

        if (followError) throw followError;
        result = { type: "follow", message: "Now following" };
        break;
      }

      case "release": {
        const { data: escrow, error: escrowError } = await supabase
          .from("escrow_transactions")
          .update({ status: "released", released_at: new Date().toISOString() })
          .eq("id", qrCode.entity_id)
          .eq("status", "held")
          .select()
          .single();

        if (escrowError) throw escrowError;
        result = { type: "escrow_release", escrow };
        break;
      }

      case "pickup": {
        const { data: item, error: itemError } = await supabase
          .from("marketplace_items")
          .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
          .eq("id", qrCode.entity_id)
          .select()
          .single();

        if (itemError) throw itemError;
        result = { type: "pickup", item };
        break;
      }

      case "delivery": {
        const { data: delivered, error: deliveryError } = await supabase
          .from("marketplace_items")
          .update({ status: "delivered", delivered_at: new Date().toISOString() })
          .eq("id", qrCode.entity_id)
          .select()
          .single();

        if (deliveryError) throw deliveryError;
        result = { type: "delivery", item: delivered };
        break;
      }

      case "book":
        result = { type: "booking", message: "Booking initiated", redirect_to: "booking_screen" };
        break;

      default:
        result = { type: "view", message: "Viewing details", entity_type: qrCode.entity_type };
    }

    await supabase
      .from("qr_scans")
      .update({ action_result: "success" })
      .eq("qr_code_id", qr_code_id)
      .eq("scanner_id", scanner_id)
      .eq("action_taken", action);

    return new Response(
      JSON.stringify({ success: true, action, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
