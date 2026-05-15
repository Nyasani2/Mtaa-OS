import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const { country_code, tax_type, gross_amount, deductions = 0, exemptions = 0 } = await req.json();
  const supabase = createClient((globalThis as any).Deno?.env?.get("SUPABASE_URL")!, (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: config } = await supabase.from("revenue_country_config").select("*").eq("country_code", country_code).single();
  if (!config) return new Response(JSON.stringify({ error: "Country not configured" }), { status: 400 });

  const taxTypes = config.tax_types || [];
  const taxConfig = taxTypes.find((t: any) => t.type === tax_type);
  if (!taxConfig) return new Response(JSON.stringify({ error: "Tax type not found" }), { status: 400 });

  const taxable_amount = Math.max(0, gross_amount - deductions - exemptions);
  let tax_liability = 0;

  if (tax_type === "income" && config.income_brackets?.length > 0) {
    // Progressive tax calculation
    let remaining = taxable_amount;
    for (const bracket of config.income_brackets) {
      const band = Math.min(remaining, bracket.limit - (bracket.floor || 0));
      tax_liability += band * (bracket.rate / 100);
      remaining -= band;
      if (remaining <= 0) break;
    }
  } else {
    tax_liability = taxable_amount * (taxConfig.rate / 100);
  }

  return new Response(JSON.stringify({
    country_code, tax_type, gross_amount, deductions, exemptions,
    taxable_amount, tax_rate: taxConfig.rate, tax_liability,
    currency: config.currency_code
  }), { headers: { "Content-Type": "application/json" } });
});
