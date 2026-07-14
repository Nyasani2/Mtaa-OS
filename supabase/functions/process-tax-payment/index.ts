import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { taxpayer_id, return_id, amount, payment_method, wallet_id } = await req.json();
  const supabase = createClient((globalThis as any).Deno?.env?.get("SUPABASE_URL")!, (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Verify return exists and is unpaid
  const { data: ret } = await supabase.from("revenue_returns").select("*, revenue_taxpayers(country_code)").eq("id", return_id).single();
  if (!ret) return new Response(JSON.stringify({ error: "Return not found" }), { status: 404 });
  if (ret.payment_status === "paid") return new Response(JSON.stringify({ error: "Already paid" }), { status: 400 });

  const country_code = ret.revenue_taxpayers?.country_code || "KE";

  // Create payment record
  const { data: payment, error: payErr } = await supabase.from("revenue_payments").insert({
    country_code, taxpayer_id, return_id, tax_type: ret.tax_type,
    payment_method, wallet_id, amount, payment_status: "completed",
    processed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }).select().single();

  if (payErr) return new Response(JSON.stringify({ error: payErr.message }), { status: 500 });

  // Update return status
  await supabase.from("revenue_returns").update({
    tax_paid: ret.tax_paid + amount,
    tax_due: Math.max(0, ret.tax_due - amount),
    payment_status: (ret.tax_paid + amount) >= ret.total_due ? "paid" : "partial",
    updated_at: new Date().toISOString()
  }).eq("id", return_id);

  // Update taxpayer balance
  await supabase.from("revenue_taxpayers").update({
    penalty_balance: Math.max(0, (ret.penalty_amount || 0) - amount),
    updated_at: new Date().toISOString()
  }).eq("id", taxpayer_id);

  return new Response(JSON.stringify({ success: true, payment_id: payment.id, amount, status: "completed" }), { headers: { "Content-Type": "application/json" } });
});
