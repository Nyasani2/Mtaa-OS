/**
 * MTAA AFRIQ — Bus Acknowledge Edge Function
 * Acknowledges message delivery
 * Deploy: supabase functions deploy bus-ack
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
    const { message_id, app_id } = body;

    if (!message_id || !app_id) {
      return new Response(
        JSON.stringify({ error: 'message_id and app_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: message } = await supabase
      .from('bus_messages')
      .select('acknowledged_by')
      .eq('id', message_id)
      .single();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const acknowledged = [...(message.acknowledged_by || []), app_id];
    const { error } = await supabase
      .from('bus_messages')
      .update({ acknowledged_by: acknowledged })
      .eq('id', message_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Bus ack error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});