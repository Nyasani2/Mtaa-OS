import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { nonce, qr_id } = await req.json();

    let qrCode: any = null;

    if (nonce) {
      const { data, error } = await supabase.from("qr_idempotency_keys").select("*").eq("nonce", nonce).single();
      if (error || !data) return new Response(JSON.stringify({ error: "Invalid or expired QR code" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      
      qrCode = { id: data.id, entity_type: "user", entity_id: data.user_id, owner_id: data.user_id, is_static: false, is_active: data.status === "pending", amount: data.amount };
      if (data.status !== "pending") return new Response(JSON.stringify({ error: "QR code has already been used or expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else if (qr_id) {
      const { data, error } = await supabase.from("qr_codes").select("*").eq("id", qr_id).eq("is_active", true).single();
      if (error || !data) return new Response(JSON.stringify({ error: "QR code not found or inactive" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      qrCode = data;
    } else {
      return new Response(JSON.stringify({ error: "Missing nonce or qr_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let entityDetails = null;
    if (qrCode.entity_type === "user") {
      const { data: profile } = await supabase.from("user_profiles").select("id, full_name, avatar_url").eq("id", qrCode.entity_id).single();
      entityDetails = profile || { id: qrCode.entity_id, type: "user" };
    } else if (qrCode.entity_type === "shop") {
      const { data: shop } = await supabase.from("shops").select("id, name, description, logo_url").eq("id", qrCode.entity_id).single();
      entityDetails = shop || { id: qrCode.entity_id, type: "shop" };
    }

    return new Response(JSON.stringify({ success: true, qr_code: qrCode, entity: entityDetails }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
