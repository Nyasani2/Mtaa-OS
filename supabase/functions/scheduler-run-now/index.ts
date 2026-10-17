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

    const { job_id } = await req.json();
    if (!job_id) return new Response(JSON.stringify({ error: 'job_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Verify job exists and user has permission
    const { data: job, error: jobError } = await supabase.from('scheduled_jobs').select('*').eq('id', job_id).single();
    if (jobError || !job) return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
    if (job.user_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized to run this job' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Execute job
    const startTime = Date.now();
    await supabase.from('scheduled_jobs').update({ status: 'running', last_run_at: new Date().toISOString() }).eq('id', job_id);
    
    const { data, error } = await supabase.functions.invoke(job.handler, { body: { job_id: job.id, payload: job.payload, user_id: job.user_id } });
    if (error) throw error;

    await supabase.from('scheduled_jobs').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', job_id);
    await supabase.from('job_logs').insert({ job_id, status: 'completed', output: data, duration_ms: Date.now() - startTime, executed_at: new Date().toISOString() });

    return new Response(JSON.stringify({ success: true, result: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
