/**
 * MTAA AFRIQ — Scheduler Schedule Creator Edge Function
 * Creates new scheduled jobs (one-time or recurring)
 * Deploy: supabase functions deploy scheduler-schedule
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      (globalThis as any).Deno?.env?.get('SUPABASE_URL') || '',
      (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { type, name, handler, execute_at, cron_expression, payload, priority, user_id } = body;

    if (!name || !handler) {
      return new Response(
        JSON.stringify({ error: 'name and handler required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const job = {
      id: jobId,
      name,
      status: 'pending',
      priority: priority || 'normal',
      handler,
      payload: payload || {},
      user_id,
      max_retries: 3,
      retry_count: 0,
      retry_delay_seconds: 60,
      timeout_seconds: 300,
      created_at: now,
      updated_at: now,
    };

    if (type === 'once') {
      if (!execute_at) {
        return new Response(
          JSON.stringify({ error: 'execute_at required for one-time jobs' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      Object.assign(job, { execute_at });
    } else if (type === 'recurring') {
      if (!cron_expression) {
        return new Response(
          JSON.stringify({ error: 'cron_expression required for recurring jobs' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      Object.assign(job, { cron_expression, next_run_at: new Date(Date.now() + 3600000).toISOString() });
    } else {
      return new Response(
        JSON.stringify({ error: 'type must be "once" or "recurring"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase.from('scheduled_jobs').insert(job);
    if (error) throw error;

    return new Response(
      JSON.stringify({ job_id: jobId, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Scheduler create error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});