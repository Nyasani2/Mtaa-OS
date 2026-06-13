// ============================================================
// MTAA SCHEDULER OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: schedule, run_now, cancel, list
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
      case "schedule":
        result = await schedulerSchedule(supabaseAdmin, user.id, params);
        break;
      case "run_now":
        result = await schedulerRunNow(supabaseAdmin, user.id, params);
        break;
      case "cancel":
        result = await schedulerCancel(supabaseAdmin, user.id, params);
        break;
      case "list":
        result = await schedulerList(supabaseAdmin, user.id, params);
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
// ACTION: SCHEDULE
// Schedule a task/job
// ============================================================
async function schedulerSchedule(supabaseAdmin, userId, params) {
  const { task_name, task_type, payload, scheduled_at, recurrence, priority = "normal" } = params;

  if (!task_name || !task_type || !scheduled_at) {
    throw new Error("Missing task_name, task_type, or scheduled_at");
  }

  const { data: task } = await supabaseAdmin
    .from("scheduled_tasks")
    .insert({
      user_id: userId,
      task_name: task_name,
      task_type: task_type,
      payload: payload || {},
      scheduled_at: scheduled_at,
      recurrence: recurrence || "once",
      priority: priority,
      status: "scheduled",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    task: {
      id: task.id,
      task_name: task.task_name,
      scheduled_at: task.scheduled_at,
      status: task.status
    },
    message: `Task "${task_name}" scheduled for ${scheduled_at}.`
  };
}

// ============================================================
// ACTION: RUN_NOW
// Execute a scheduled task immediately
// ============================================================
async function schedulerRunNow(supabaseAdmin, userId, params) {
  const { task_id } = params;

  if (!task_id) {
    throw new Error("Missing task_id");
  }

  // Get task
  const { data: task } = await supabaseAdmin
    .from("scheduled_tasks")
    .select("*")
    .eq("id", task_id)
    .eq("user_id", userId)
    .single();

  if (!task) throw new Error("Task not found");

  // Execute task (simulate)
  const executionResult = {
    executed_at: new Date().toISOString(),
    status: "completed",
    output: `Task "${task.task_name}" executed successfully.`
  };

  // Update task
  await supabaseAdmin
    .from("scheduled_tasks")
    .update({
      status: "completed",
      executed_at: executionResult.executed_at,
      execution_result: executionResult
    })
    .eq("id", task_id);

  return {
    success: true,
    execution: executionResult,
    task_id: task_id,
    message: `Task "${task.task_name}" executed immediately.`
  };
}

// ============================================================
// ACTION: CANCEL
// Cancel a scheduled task
// ============================================================
async function schedulerCancel(supabaseAdmin, userId, params) {
  const { task_id } = params;

  if (!task_id) {
    throw new Error("Missing task_id");
  }

  const { data: task } = await supabaseAdmin
    .from("scheduled_tasks")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString()
    })
    .eq("id", task_id)
    .eq("user_id", userId)
    .select()
    .single();

  if (!task) throw new Error("Task not found or not authorized");

  return {
    success: true,
    task_id: task_id,
    status: "cancelled",
    message: `Task "${task.task_name}" cancelled.`
  };
}

// ============================================================
// ACTION: LIST
// List scheduled tasks
// ============================================================
async function schedulerList(supabaseAdmin, userId, params) {
  const { status, limit = 20, offset = 0 } = params;

  let query = supabaseAdmin
    .from("scheduled_tasks")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: tasks, count, error } = await query;

  if (error) throw new Error("Failed to list tasks: " + error.message);

  return {
    success: true,
    tasks: tasks || [],
    total: count || 0,
    limit: limit,
    offset: offset,
    message: `${(tasks || []).length} task(s) found.`
  };
}
