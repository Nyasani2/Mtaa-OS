import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Force user_id from authenticated user
    const user_id = user.id;
    const { amount } = await req.json();

    const nonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60000); // 1 minute expiry

    const { data, error } = await supabaseAdmin
      .from('qr_idempotency_keys')
      .insert({
        nonce,
        user_id,
        amount: amount || 0.0,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      payload: { type: 'mtaa_pay', nonce, exp: expiresAt.toISOString(), uid: user_id }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
