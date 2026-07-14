import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { country_code, fiscal_year, revenue_period } = await req.json();
  const supabase = createClient((globalThis as any).Deno?.env?.get("SUPABASE_URL")!, (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Pull from revenue_payments
  const { data: taxRevenue } = await supabase.from("revenue_payments").select("tax_type, amount").eq("country_code", country_code).eq("payment_status", "completed");

  // Aggregate by source
  const bySource: Record<string, number> = {};
  (taxRevenue || []).forEach((r: any) => {
    bySource[r.tax_type] = (bySource[r.tax_type] || 0) + (r.amount || 0);
  });

  // Insert/update treasury_revenue records
  for (const [source, amount] of Object.entries(bySource)) {
    const { data: existing } = await supabase.from("treasury_revenue").select("id, actual_amount").eq("country_code", country_code).eq("fiscal_year", fiscal_year).eq("revenue_period", revenue_period).eq("revenue_source", source).maybeSingle();
    if (existing) {
      await supabase.from("treasury_revenue").update({ actual_amount: amount, variance_amount: amount - existing.projected_amount, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("treasury_revenue").insert({ country_code, fiscal_year, revenue_period, revenue_source: source, source_type: "tax", actual_amount: amount, created_at: new Date().toISOString() });
    }
  }

  return new Response(JSON.stringify({ success: true, sources: Object.keys(bySource).length, total: Object.values(bySource).reduce((a: number, b: number) => a + b, 0) }), { headers: { "Content-Type": "application/json" } });
});
