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
    const {
      entity_type,
      entity_id,
      owner_id,
      qr_name,
      is_static = true,
      default_action,
      prefilled_amount,
      prefilled_currency = "KES",
      prefilled_description,
      prefilled_metadata = {},
      expires_at,
      max_scans,
    } = body;

    const validTypes = [
      "user", "shop", "agent", "matatu", "hospital",
      "government", "county", "department", "escrow",
      "goods", "business", "creator", "transport"
    ];
    if (!validTypes.includes(entity_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid entity_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (is_static) {
      await supabase
        .from("qr_codes")
        .update({ is_active: false })
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .eq("is_static", true)
        .eq("is_active", true);
    }

    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        entity_type,
        entity_id,
        owner_id,
        qr_name,
        is_static,
        default_action,
        prefilled_amount,
        prefilled_currency,
        prefilled_description,
        prefilled_metadata,
        expires_at,
        max_scans,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, qr_code: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
