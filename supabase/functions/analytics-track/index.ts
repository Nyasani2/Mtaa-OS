import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient((globalThis as any).Deno?.env?.get('SUPABASE_URL')!, (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { event_type, event_name, user_id, session_id, app_id, page, properties, timestamp } = await req.json();

    if (!event_type || !event_name) {
      return new Response(JSON.stringify({ error: 'event_type and event_name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_type,
      event_name,
      user_id: user_id || null,
      session_id: session_id || crypto.randomUUID(),
      app_id: app_id || null,
      page: page || null,
      properties: properties || {},
      timestamp: timestamp || new Date().toISOString(),
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
