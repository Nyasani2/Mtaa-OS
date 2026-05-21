// supabase/functions/shop-marketplace-sync/index.ts
// Sync shop products to marketplace, handle search indexing

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

    const { action, shop_id, product_id } = await req.json();

    if (action === "sync_all") {
      // Get all active products not yet listed
      const { data: products } = await supabase
        .from("shop_products")
        .select("*")
        .eq("shop_id", shop_id)
        .eq("is_active", true)
        .not("id", "in", supabase.from("marketplace_listings").select("product_id").eq("shop_id", shop_id));

      const listings = (products || []).map(p => ({
        shop_id,
        product_id: p.id,
        marketplace_price: p.sale_price || p.base_price,
        marketplace_description: p.description,
        marketplace_images: p.images,
        status: "active",
      }));

      if (listings.length > 0) {
        await supabase.from("marketplace_listings").insert(listings);
      }

      return new Response(JSON.stringify({ synced: listings.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_product") {
      const { data: product } = await supabase
        .from("shop_products")
        .select("*")
        .eq("id", product_id)
        .single();

      if (!product) throw new Error("Product not found");

      const { data: existing } = await supabase
        .from("marketplace_listings")
        .select("id")
        .eq("product_id", product_id)
        .single();

      const listing = {
        shop_id: product.shop_id,
        product_id: product.id,
        marketplace_price: product.sale_price || product.base_price,
        marketplace_description: product.description,
        marketplace_images: product.images,
        status: product.is_active ? "active" : "paused",
      };

      if (existing) {
        await supabase.from("marketplace_listings").update(listing).eq("id", existing.id);
      } else {
        await supabase.from("marketplace_listings").insert(listing);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search") {
      const { query, category, lat, lng, radius_km = 50, limit = 20 } = await req.json();

      let dbQuery = supabase
        .from("marketplace_listings")
        .select("*, product:product_id(*), shop:shop_id(name, rating, latitude, longitude)")
        .eq("status", "active");

      if (query) {
        dbQuery = dbQuery.or(`product.name.ilike.%${query}%,product.description.ilike.%${query}%`);
      }

      if (category) {
        dbQuery = dbQuery.eq("shop.category", category);
      }

      const { data: listings, error } = await dbQuery.limit(limit);

      if (error) throw error;

      // Filter by distance if coordinates provided
      let results = listings || [];
      if (lat && lng) {
        results = results.filter((l: any) => {
          if (!l.shop?.latitude || !l.shop?.longitude) return true;
          const d = Math.sqrt(Math.pow(l.shop.latitude - lat, 2) + Math.pow(l.shop.longitude - lng, 2)) * 111;
          return d <= radius_km;
        });
      }

      return new Response(JSON.stringify({ listings: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
