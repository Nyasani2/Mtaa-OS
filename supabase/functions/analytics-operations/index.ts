// ============================================================
// MTAA ANALYTICS OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: track, metric, realtime
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
      case "track":
        result = await analyticsTrack(supabaseAdmin, user.id, params);
        break;
      case "metric":
        result = await analyticsMetric(supabaseAdmin, user.id, params);
        break;
      case "realtime":
        result = await analyticsRealtime(supabaseAdmin, user.id, params);
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
// ACTION: TRACK
// Track an analytics event
// ============================================================
async function analyticsTrack(supabaseAdmin, userId, params) {
  const { event, metadata, module, screen, device, location } = params;

  if (!event) {
    throw new Error("Missing event name");
  }

  const { data: tracked } = await supabaseAdmin
    .from("analytics_events")
    .insert({
      user_id: userId,
      event: event,
      metadata: metadata || {},
      module: module || "general",
      device: device,
      location: location,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    event_id: tracked.id,
    message: `Event "${event}" tracked successfully.`
  };
}

// ============================================================
// ACTION: METRIC
// Get analytics metrics for a period
// ============================================================
async function analyticsMetric(supabaseAdmin, userId, params) {
  const { metric_type, period = "today", module, start_date, end_date } = params;

  // Date range
  const now = new Date();
  let start, end;

  if (start_date && end_date) {
    start = new Date(start_date);
    end = new Date(end_date);
  } else {
    switch (period) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "week":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }
  }

  let query = supabaseAdmin
    .from("analytics_events")
    .select("*", { count: "exact" })
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (module) {
    query = query.eq("module", module);
  }

  if (metric_type) {
    query = query.eq("event", metric_type);
  }

  const { data: events, count, error } = await query;

  if (error) throw new Error("Failed to fetch metrics: " + error.message);

  // Aggregate by event type
  const byEvent = {};
  (events || []).forEach(e => {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  });

  return {
    success: true,
    period: period,
    total_events: count || 0,
    by_event: byEvent,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    message: `Metrics retrieved for ${period}. Total events: ${count || 0}.`
  };
}

// ============================================================
// ACTION: REALTIME
// Get realtime analytics snapshot
// ============================================================
async function analyticsRealtime(supabaseAdmin, userId, params) {
  const { module } = params;

  // Get active users in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);

  let query = supabaseAdmin
    .from("analytics_events")
    .select("user_id, event, module, created_at")
    .gte("created_at", fiveMinutesAgo.toISOString());

  if (module) {
    query = query.eq("module", module);
  }

  const { data: recentEvents } = await query;

  // Unique active users
  const activeUsers = new Set((recentEvents || []).map(e => e.user_id)).size;

  // Events in last 5 minutes
  const eventCount = (recentEvents || []).length;

  // Top events
  const topEvents = {};
  (recentEvents || []).forEach(e => {
    topEvents[e.event] = (topEvents[e.event] || 0) + 1;
  });

  return {
    success: true,
    realtime: {
      active_users: activeUsers,
      events_last_5min: eventCount,
      top_events: topEvents,
      timestamp: new Date().toISOString()
    },
    message: `Realtime snapshot: ${activeUsers} active users, ${eventCount} events in last 5 minutes.`
  };
}
