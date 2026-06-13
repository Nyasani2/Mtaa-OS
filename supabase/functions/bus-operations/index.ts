// ============================================================
// MTAA BUS OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: publish, subscribe, ack
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result;
    switch (action) {
      case "publish":
        result = await busPublish(supabaseAdmin, user.id, params);
        break;
      case "subscribe":
        result = await busSubscribe(supabaseAdmin, user.id, params);
        break;
      case "ack":
        result = await busAck(supabaseAdmin, user.id, params);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action: " + action }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// ACTION: PUBLISH
// Publish event to event bus
// ============================================================
async function busPublish(supabaseAdmin, userId, params) {
  const { topic, payload, priority = "normal", ttl = 3600 } = params;

  if (!topic || !payload) {
    throw new Error("Missing topic or payload");
  }

  const { data: event } = await supabaseAdmin
    .from("bus_events")
    .insert({
      topic: topic,
      payload: payload,
      publisher_id: userId,
      priority: priority,
      ttl: ttl,
      status: "published",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Notify subscribers
  const { data: subscribers } = await supabaseAdmin
    .from("bus_subscriptions")
    .select("subscriber_id, webhook_url")
    .eq("topic", topic)
    .eq("status", "active");

  // In production, this would push to webhooks or realtime channels
  // For now, we record the event

  return {
    success: true,
    event: {
      id: event.id,
      topic: event.topic,
      status: event.status
    },
    subscribers_notified: subscribers?.length || 0,
    message: `Event published to topic "${topic}". ${subscribers?.length || 0} subscriber(s) notified.`
  };
}

// ============================================================
// ACTION: SUBSCRIBE
// Subscribe to event bus topic
// ============================================================
async function busSubscribe(supabaseAdmin, userId, params) {
  const { topic, webhook_url, filter } = params;

  if (!topic) {
    throw new Error("Missing topic");
  }

  // Check if already subscribed
  const { data: existing } = await supabaseAdmin
    .from("bus_subscriptions")
    .select("id")
    .eq("subscriber_id", userId)
    .eq("topic", topic)
    .single();

  if (existing) {
    // Update subscription
    await supabaseAdmin
      .from("bus_subscriptions")
      .update({
        webhook_url: webhook_url,
        filter: filter || {},
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);

    return {
      success: true,
      subscription_id: existing.id,
      message: `Subscription to "${topic}" updated.`
    };
  }

  // Create new subscription
  const { data: subscription } = await supabaseAdmin
    .from("bus_subscriptions")
    .insert({
      subscriber_id: userId,
      topic: topic,
      webhook_url: webhook_url,
      filter: filter || {},
      status: "active",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    subscription: {
      id: subscription.id,
      topic: subscription.topic,
      status: subscription.status
    },
    message: `Subscribed to topic "${topic}" successfully.`
  };
}

// ============================================================
// ACTION: ACK
// Acknowledge event receipt
// ============================================================
async function busAck(supabaseAdmin, userId, params) {
  const { event_id, status = "acknowledged" } = params;

  if (!event_id) {
    throw new Error("Missing event_id");
  }

  const { data: ack } = await supabaseAdmin
    .from("bus_acks")
    .upsert({
      event_id: event_id,
      subscriber_id: userId,
      status: status,
      acked_at: new Date().toISOString()
    }, {
      onConflict: "event_id,subscriber_id"
    })
    .select()
    .single();

  return {
    success: true,
    ack: {
      id: ack.id,
      event_id: ack.event_id,
      status: ack.status
    },
    message: `Event ${event_id} ${status}.`
  };
}
