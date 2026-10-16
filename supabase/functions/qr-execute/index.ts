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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: "No authorization header", code: "UNAUTHORIZED" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token", code: "UNAUTHORIZED" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    const authenticatedUserId = user.id
    const { nonce, scanner_user_id, amount } = await req.json();

    if (scanner_user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized: You can only scan as yourself", code: "UNAUTHORIZED" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!nonce || !amount) throw new Error("Missing required fields");

    const { data: record, error: fetchError } = await supabaseAdmin.from('qr_idempotency_keys').select('*').eq('nonce', nonce).single();
    if (fetchError || !record) return new Response(JSON.stringify({ error: "Invalid or unrecognized QR code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (new Date(record.expires_at) < new Date()) {
      await supabaseAdmin.from('qr_idempotency_keys').update({ status: 'expired' }).eq('nonce', nonce);
      return new Response(JSON.stringify({ error: "QR code has expired. Please ask the user to refresh." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (record.status === 'completed') {
      return new Response(JSON.stringify({ error: "Transaction already processed" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: updateError } = await supabaseAdmin.from('qr_idempotency_keys').update({ status: 'completed', merchant_id: authenticatedUserId, amount: amount }).eq('nonce', nonce);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: "Payment successful", transaction_id: record.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
