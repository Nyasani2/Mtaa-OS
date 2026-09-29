import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { name, category, address, city, description, owner_id, is_active, is_verified } = await req.json();

    // 1. Create the shop
    const { data: shop, error: shopError } = await supabaseClient
      .from("shops")
      .insert({
        name,
        category,
        address,
        city,
        description,
        owner_id,
        is_active: is_active ?? true,
        is_verified: is_verified ?? false,
      })
      .select()
      .single();

    if (shopError) throw shopError;

    // 2. Assign the owner as 'owner' role in shop_staff
    const { error: staffError } = await supabaseClient
      .from("shop_staff")
      .insert({
        shop_id: shop.id,
        user_id: owner_id,
        role_name: "owner",
        is_active: true,
        joined_at: new Date().toISOString(),
      });

    if (staffError) throw staffError;

    return new Response(JSON.stringify({ shop }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
