// supabase/functions/shop-accounting-sync/index.ts
// Sync orders/expenses to journal entries, generate reports

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

    const { action, shop_id, start_date, end_date } = await req.json();

    if (action === "sync_orders") {
      // Create journal entries for all unprocessed orders
      const { data: orders } = await supabase
        .from("shop_orders")
        .select("*")
        .eq("shop_id", shop_id)
        .eq("status", "delivered")
        .is("journal_entry_id", null);

      for (const order of orders || []) {
        await supabase.rpc("create_order_journal_entry", {
          p_order_id: order.id,
          p_shop_id: shop_id,
        });
      }

      return new Response(JSON.stringify({ synced: orders?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "profit_loss") {
      const { data: revenue } = await supabase
        .from("shop_journal_lines")
        .select("credit, shop_accounts!inner(type)")
        .eq("shop_accounts.type", "revenue")
        .gte("shop_journal_entries.date", start_date)
        .lte("shop_journal_entries.date", end_date);

      const { data: expenses } = await supabase
        .from("shop_journal_lines")
        .select("debit, shop_accounts!inner(type)")
        .eq("shop_accounts.type", "expense")
        .gte("shop_journal_entries.date", start_date)
        .lte("shop_journal_entries.date", end_date);

      const totalRevenue = revenue?.reduce((sum, r) => sum + (r.credit || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.debit || 0), 0) || 0;

      return new Response(JSON.stringify({
        revenue: totalRevenue,
        expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
        margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2) : 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "balance_sheet") {
      const { data: accounts } = await supabase
        .from("shop_accounts")
        .select("type, current_balance")
        .eq("shop_id", shop_id);

      const assets = accounts?.filter(a => a.type === "asset").reduce((s, a) => s + a.current_balance, 0) || 0;
      const liabilities = accounts?.filter(a => a.type === "liability").reduce((s, a) => s + a.current_balance, 0) || 0;
      const equity = accounts?.filter(a => a.type === "equity").reduce((s, a) => s + a.current_balance, 0) || 0;

      return new Response(JSON.stringify({ assets, liabilities, equity, balanced: Math.abs(assets - liabilities - equity) < 0.01 }), {
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
