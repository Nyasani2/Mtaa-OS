import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

(globalThis as any).Deno?.serve(async (req) => {
  const { method } = req;
  const supabase = createClient(
    (globalThis as any).Deno?.env?.get('SUPABASE_URL') || '',
    (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  if (method === 'POST') {
    const body = await req.json();
    const { data, error } = await supabase.from('kernel_health_snapshots').insert({
      phase: body.phase,
      health_score: body.health_score,
      active_apps: body.active_apps,
      event_throughput: body.event_throughput,
      uptime_ms: body.uptime_ms,
      error_count: body.error_count,
      metrics: body.metrics || {},
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  }

  if (method === 'GET') {
    const { data, error } = await supabase
      .from('kernel_health_snapshots')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(100);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});