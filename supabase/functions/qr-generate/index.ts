import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const user_id = body.user_id;
    console.log("🔔 qr-generate called with user_id:", user_id);
    
    if (!user_id || typeof user_id !== 'string') {
      return new Response(JSON.stringify({ error: "user_id is required and must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const nonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60000);

    console.log("📝 Attempting database insert...");
    const { data, error } = await supabaseAdmin
      .from('qr_idempotency_keys')
      .insert({
        nonce,
        user_id,
        amount: 0.0, // Ensure it's a decimal
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select();

    if (error) {
      console.error("❌ Database insert failed:", error);
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: error.message,
        hint: error.hint
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ QR code generated successfully");
    return new Response(JSON.stringify({ 
      success: true, 
      payload: { type: 'mtaa_pay', nonce, exp: expiresAt.toISOString(), uid: user_id } 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Function crashed:", error);
    return new Response(JSON.stringify({ error: "Internal server error: " + error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
