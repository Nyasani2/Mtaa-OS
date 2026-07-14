/**
 * MTAA AFRIQ — Bus Subscribe Edge Function
 * Creates channel subscriptions
 * Deploy: supabase functions deploy bus-subscribe
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
    const { app_id, channel, topics, user_id, filter, priority_min } = body;

    if (!app_id || !channel) {
      return new Response(
        JSON.stringify({ error: 'app_id and channel required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase.from('bus_subscriptions').insert({
      id: subscriptionId,
      app_id,
      channel,
      topics: topics || ['*'],
      user_id,
      filter: filter || {},
      priority_min,
      active: true,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ subscription_id: subscriptionId, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Bus subscribe error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
