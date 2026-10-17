import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { type, name, handler, execute_at, cron_expression, payload } = await req.json();
    if (!name || !handler) return new Response(JSON.stringify({ error: 'name and handler required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Verify Admin Role for scheduling
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only admins can schedule jobs' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const job = {
      id: jobId, name, status: 'pending', priority: 'normal', handler, payload: payload || {},
      user_id: user.id, max_retries: 3, retry_count: 0, retry_delay_seconds: 60, timeout_seconds: 300,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };

    if (type === 'once') {
      if (!execute_at) return new Response(JSON.stringify({ error: 'execute_at required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      Object.assign(job, { execute_at });
    } else if (type === 'recurring') {
      if (!cron_expression) return new Response(JSON.stringify({ error: 'cron_expression required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      Object.assign(job, { cron_expression, next_run_at: new Date(Date.now() + 3600000).toISOString() });
    } else {
      return new Response(JSON.stringify({ error: 'type must be "once" or "recurring"' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error } = await supabase.from('scheduled_jobs').insert(job);
    if (error) throw error;

    return new Response(JSON.stringify({ job_id: jobId, success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
