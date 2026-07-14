import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { expenditure_id, action, authorized_by } = await req.json();
  const supabase = createClient((globalThis as any).Deno?.env?.get("SUPABASE_URL")!, (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: exp } = await supabase.from("treasury_expenditures").select("*, treasury_budgets(available_amount, spent_amount, budget_code), treasury_accounts(current_balance)").eq("id", expenditure_id).single();
  if (!exp) return new Response(JSON.stringify({ error: "Expenditure not found" }), { status: 404 });

  if (action === "approve") {
    if (exp.net_amount > exp.treasury_budgets.available_amount) {
      return new Response(JSON.stringify({ error: "Insufficient budget allocation" }), { status: 400 });
    }
    await supabase.from("treasury_expenditures").update({ payment_status: "approved", approved_by: authorized_by, approved_at: new Date().toISOString() }).eq("id", expenditure_id);
    await supabase.from("treasury_budgets").update({ committed_amount: exp.treasury_budgets.committed_amount + exp.net_amount, available_amount: exp.treasury_budgets.available_amount - exp.net_amount }).eq("id", exp.budget_id);
  } else if (action === "authorize") {
    await supabase.from("treasury_expenditures").update({ payment_status: "authorized", authorized_by: authorized_by, authorized_at: new Date().toISOString() }).eq("id", expenditure_id);
    await supabase.from("treasury_budgets").update({ spent_amount: exp.treasury_budgets.spent_amount + exp.net_amount, committed_amount: exp.treasury_budgets.committed_amount - exp.net_amount }).eq("id", exp.budget_id);
    await supabase.from("treasury_accounts").update({ current_balance: exp.treasury_accounts.current_balance - exp.net_amount, budget_utilized: exp.treasury_accounts.budget_utilized + exp.net_amount }).eq("id", exp.account_id);
  } else if (action === "pay") {
    await supabase.from("treasury_expenditures").update({ payment_status: "paid", cleared_at: new Date().toISOString() }).eq("id", expenditure_id);
  }

  return new Response(JSON.stringify({ success: true, expenditure_id, action }), { headers: { "Content-Type": "application/json" } });
});
