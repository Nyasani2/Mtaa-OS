import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const { country_code, fiscal_year } = await req.json();
  const supabase = createClient((globalThis as any).Deno?.env?.get("SUPABASE_URL")!, (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const prefix = country_code;
  const year = fiscal_year.toString().slice(-2);
  const random = Math.floor(100000 + Math.random() * 900000);
  const voucher_number = `${prefix}-${year}-${random}`;

  const { data: existing } = await supabase.from("treasury_expenditures").select("id").eq("voucher_number", voucher_number).maybeSingle();
  if (existing) return new Response(JSON.stringify({ error: "Collision, retry" }), { status: 409 });

  return new Response(JSON.stringify({ voucher_number, country_code, fiscal_year }), { headers: { "Content-Type": "application/json" } });
});
