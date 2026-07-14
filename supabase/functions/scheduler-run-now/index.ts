/**
 * MTAA AFRIQ — Scheduler Job Runner Edge Function
 * Executes scheduled jobs via Supabase Edge Functions
 * Deploy: supabase functions deploy scheduler-run-now
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
      (globalThis as any).Deno?.env?.get('SUPABASE_URL')!,
      (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { job_id } = body;

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as running
    const startTime = Date.now();
    await supabase
      .from('scheduled_jobs')
      .update({ status: 'running', last_run_at: new Date().toISOString() })
      .eq('id', job_id);

    // Execute handler
    let result: Record<string, unknown> = {};
    let success = true;
    let errorMessage: string | undefined;

    try {
      const { data, error } = await supabase.functions.invoke(job.handler, {
        body: {
          job_id: job.id,
          job_name: job.name,
          payload: job.payload,
          user_id: job.user_id,
        },
      });

      if (error) throw error;
      result = data || {};
    } catch (execErr) {
      success = false;
      errorMessage = execErr instanceof Error ? execErr.message : String(execErr);
    }

    const duration = Date.now() - startTime;
    const now = new Date().toISOString();

    // Update job status
    if (success) {
      if (job.cron_expression) {
        // Recurring: reset to pending with next run
        const nextRun = new Date(Date.now() + 3600000).toISOString(); // Placeholder
        await supabase
          .from('scheduled_jobs')
          .update({ status: 'pending', next_run_at: nextRun, retry_count: 0, updated_at: now })
          .eq('id', job_id);
      } else {
        // One-time: mark complete
        await supabase
          .from('scheduled_jobs')
          .update({ status: 'completed', updated_at: now })
          .eq('id', job_id);
      }
    } else {
      // Failed: increment retry or mark failed
      if (job.retry_count < job.max_retries) {
        const retryAt = new Date(Date.now() + job.retry_delay_seconds * 1000).toISOString();
        await supabase
          .from('scheduled_jobs')
          .update({
            status: 'retrying',
            retry_count: job.retry_count + 1,
            execute_at: retryAt,
            error_message: errorMessage,
            updated_at: now,
          })
          .eq('id', job_id);
      } else {
        await supabase
          .from('scheduled_jobs')
          .update({ status: 'failed', error_message: errorMessage, updated_at: now })
          .eq('id', job_id);
      }
    }

    // Log result
    await supabase.from('job_logs').insert({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      job_id,
      status: success ? 'completed' : 'failed',
      output: success ? result : undefined,
      error: errorMessage,
      duration_ms: duration,
      executed_at: now,
    });

    return new Response(
      JSON.stringify({ success, result, duration_ms: duration }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Scheduler runner error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
