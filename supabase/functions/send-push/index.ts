import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 1. Verify Authentication (Prevent spamming push notifications)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { tokens, title, body, data } = await req.json();
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'No tokens provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const messages = tokens.map((token: string) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
