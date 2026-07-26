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
    const { qr_id, scanner_id, scanner_lat, scanner_lng, scanner_device_id } = body;

    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", qr_id)
      .eq("is_active", true)
      .single();

    if (qrError || !qrCode) {
      return new Response(
        JSON.stringify({ error: "QR code not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "QR code has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (qrCode.max_scans && qrCode.scan_count >= qrCode.max_scans) {
      return new Response(
        JSON.stringify({ error: "QR code scan limit reached" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("qr_scans").insert({
      qr_code_id: qr_id,
      scanner_id,
      scanner_lat,
      scanner_lng,
      scanner_device_id,
    });

    let entityDetails = null;
    const entityId = qrCode.entity_id;

    switch (qrCode.entity_type) {
      case "user": {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, phone")
          .eq("id", entityId)
          .single();
        entityDetails = profile;
        break;
      }

      case "shop": {
        const { data: shop } = await supabase
          .from("shops")
          .select("id, name, description, logo_url, location")
          .eq("id", entityId)
          .single();
        entityDetails = shop;
        break;
      }

      case "agent": {
        const { data: agent } = await supabase
          .from("agents")
          .select("id, business_name, agent_level, location, services")
          .eq("id", entityId)
          .single();
        entityDetails = agent;
        break;
      }

      case "hospital": {
        const { data: hospital } = await supabase
          .from("health_facilities")
          .select("id, name, type, location, services")
          .eq("id", entityId)
          .single();
        entityDetails = hospital;
        break;
      }

      case "escrow": {
        const { data: escrow } = await supabase
          .from("escrow_transactions")
          .select("id, status, amount, currency, description, buyer_id, seller_id")
          .eq("id", entityId)
          .single();
        entityDetails = escrow;
        break;
      }

      case "goods": {
        const { data: goods } = await supabase
          .from("marketplace_items")
          .select("id, title, price, currency, seller_id, status")
          .eq("id", entityId)
          .single();
        entityDetails = goods;
        break;
      }

      default:
        entityDetails = { id: entityId, type: qrCode.entity_type };
    }

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
  const isOwner = scannerId === qrCode.owner_id;
  const actions: any[] = [];

  const baseActions: Record<string, any[]> = {
    user: [
      { id: "pay", label: "Send Money", icon: "send", description: "Send money to this user" },
      { id: "request", label: "Request Money", icon: "request", description: "Request payment from this user" },
      { id: "follow", label: "Follow", icon: "user-plus", description: "Follow this user" },
      { id: "profile", label: "View Profile", icon: "user", description: "View user's profile" },
    ],
    shop: [
      { id: "pay", label: "Pay Shop", icon: "credit-card", description: "Make payment to this shop" },
      { id: "menu", label: "View Menu", icon: "list", description: "Browse shop products/services" },
      { id: "book", label: "Book Service", icon: "calendar", description: "Book an appointment or service" },
      { id: "follow", label: "Follow Shop", icon: "heart", description: "Follow this shop" },
    ],
    agent: [
      { id: "deposit", label: "Deposit Cash", icon: "arrow-down", description: "Deposit cash via agent" },
      { id: "withdraw", label: "Withdraw Cash", icon: "arrow-up", description: "Withdraw cash via agent" },
      { id: "verify", label: "Verify Agent", icon: "shield", description: "Verify this agent" },
      { id: "find", label: "Get Directions", icon: "map-pin", description: "Navigate to agent location" },
    ],
    matatu: [
      { id: "pay_fare", label: "Pay Fare", icon: "bus", description: "Pay matatu fare" },
      { id: "route", label: "View Route", icon: "map", description: "View matatu route" },
      { id: "track", label: "Track", icon: "navigation", description: "Track matatu location" },
    ],
    hospital: [
      { id: "pay", label: "Pay Hospital", icon: "credit-card", description: "Make payment to hospital" },
      { id: "book", label: "Book Appointment", icon: "calendar", description: "Book a medical appointment" },
      { id: "services", label: "View Services", icon: "activity", description: "View available services" },
    ],
    government: [
      { id: "pay_tax", label: "Pay Tax", icon: "file-text", description: "Pay taxes or fees" },
      { id: "pay_fee", label: "Pay Fee", icon: "dollar-sign", description: "Pay government fees" },
      { id: "services", label: "View Services", icon: "grid", description: "View government services" },
    ],
    escrow: [
      { id: "release", label: "Release Goods", icon: "unlock", description: "Release escrowed goods" },
      { id: "status", label: "View Status", icon: "eye", description: "View escrow status" },
      { id: "dispute", label: "File Dispute", icon: "alert-circle", description: "File a dispute" },
    ],
    goods: [
      { id: "pickup", label: "Pick Up Goods", icon: "package", description: "Confirm goods pickup" },
      { id: "delivery", label: "Confirm Delivery", icon: "check-circle", description: "Confirm delivery received" },
      { id: "track", label: "Track Order", icon: "truck", description: "Track delivery status" },
    ],
  };

  const typeActions = baseActions[entityType] || [
    { id: "pay", label: "Pay", icon: "credit-card", description: "Make payment" },
    { id: "view", label: "View Details", icon: "eye", description: "View details" },
  ];

  if (!qrCode.is_static && qrCode.prefilled_amount) {
    actions.push({
      id: "pay_prefilled",
      label: `Pay ${qrCode.prefilled_currency} ${qrCode.prefilled_amount}`,
      icon: "credit-card",
      description: qrCode.prefilled_description || "Quick pay prefilled amount",
      prefilled: {
        amount: qrCode.prefilled_amount,
        currency: qrCode.prefilled_currency,
        description: qrCode.prefilled_description,
      },
    });
  }

  actions.push(...typeActions);

  if (isOwner) {
    actions.push(
      { id: "edit_qr", label: "Edit QR", icon: "edit", description: "Edit QR settings" },
      { id: "analytics", label: "Scan Analytics", icon: "bar-chart", description: "View scan statistics" }
    );
  }

  return actions;
}
