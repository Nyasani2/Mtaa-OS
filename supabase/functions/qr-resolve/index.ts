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
    const { nonce, qr_id, scanner_id } = body;

    let qrCode: any = null;

    // 1. Try new secure nonce system first
    if (nonce) {
      const { data, error } = await supabase
        .from("qr_idempotency_keys")
        .select("*")
        .eq("nonce", nonce)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Invalid or expired QR code" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Map idempotency record to qrCode format for compatibility
      qrCode = {
        id: data.id,
        entity_type: "user", // Default to user for payment QRs, can be expanded
        entity_id: data.user_id,
        owner_id: data.user_id,
        is_static: false,
        is_active: data.status === "pending"
      };

      if (data.status !== "pending") {
        return new Response(JSON.stringify({ error: "QR code has already been used or expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } 
    // 2. Fallback to legacy qr_id system (for existing education/shop QRs)
    else if (qr_id) {
      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("id", qr_id)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "QR code not found or inactive" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      qrCode = data;
    } else {
      return new Response(JSON.stringify({ error: "Missing nonce or qr_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Fetch Entity Details (The "MTAA Website" Data)
    let entityDetails = null;
    const entityId = qrCode.entity_id;

    switch (qrCode.entity_type) {
      case "user": {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, phone, username")
          .eq("id", entityId)
          .single();
        entityDetails = profile || { id: entityId, type: "user" };
        break;
      }
      case "shop": {
        const { data: shop } = await supabase
          .from("shops")
          .select("id, name, description, logo_url, location, category")
          .eq("id", entityId)
          .single();
        entityDetails = shop || { id: entityId, type: "shop" };
        break;
      }
      case "institution": { // For schools, hospitals, etc.
        const { data: inst } = await supabase
          .from("institutions") // Adjust table name as needed
          .select("id, name, type, location, logo_url")
          .eq("id", entityId)
          .single();
        entityDetails = inst || { id: entityId, type: "institution" };
        break;
      }
      default:
        entityDetails = { id: entityId, type: qrCode.entity_type };
    }

    // 4. Get Available Actions
    const actions = getAvailableActions(qrCode.entity_type, qrCode, entityDetails, scanner_id);

    return new Response(
      JSON.stringify({ success: true, qr_code: qrCode, entity: entityDetails, actions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getAvailableActions(entityType: string, qrCode: any, entity: any, scannerId: string) {
  const actions: any[] = [];

  if (entityType === "user") {
    actions.push(
      { id: "pay", label: "Send Money", icon: "send", description: "Send money to this user", route: "/wallet/send" },
      { id: "profile", label: "View Profile", icon: "user", description: "View user's profile", route: `/profile/${entity.id}` }
    );
  } else if (entityType === "shop") {
    actions.push(
      { id: "pay_shop", label: "Pay Shop", icon: "credit-card", description: "Make payment", route: "/wallet/qr-scan" },
      { id: "view_menu", label: "View Menu/Website", icon: "list", description: "Browse shop offerings", route: `/business/${entity.id}` },
      { id: "follow", label: "Follow Shop", icon: "heart", description: "Follow this shop" }
    );
  } else if (entityType === "institution") {
    actions.push(
      { id: "view_website", label: "View Institution Page", icon: "globe", description: "View details", route: `/business/${entity.id}` },
      { id: "contact", label: "Contact", icon: "phone", description: "Get in touch" }
    );
  } else {
    actions.push({ id: "view", label: "View Details", icon: "eye", description: "View details" });
  }

  return actions;
}
