// supabase/functions/shop-pos-scan/index.ts
// Barcode/QR code scanning for POS - returns product by barcode/QR

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { code, shop_id, type } = await req.json(); // type: 'barcode' | 'qr'
    if (!code || !shop_id) throw new Error("code and shop_id required");

    const column = type === "qr" ? "qr_code" : "barcode";

    const { data: product, error } = await supabase
      .from("shop_products")
      .select("*, shop:shop_id(name, tax_rate)")
      .eq("shop_id", shop_id)
      .eq(column, code)
      .eq("is_active", true)
      .single();

    if (error || !product) {
      return new Response(JSON.stringify({ found: false, message: "Product not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Check stock
    if (product.track_inventory && product.stock_quantity <= 0 && !product.allow_backorders) {
      return new Response(JSON.stringify({ found: true, product, in_stock: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ found: true, product, in_stock: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
