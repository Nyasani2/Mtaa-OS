import { supabase } from '@/lib/supabase';

export async function syncAccountingData(shopId: string, period: string) {
  const { data: orders, error: ordersError } = await supabase.from('shop_orders')
    .select('*')
    .eq('shop_id', shopId)
    .gte('created_at', period + '-01')
    .lte('created_at', period + '-31')
    .eq('status', 'delivered');

  if (ordersError) throw ordersError;

  const revenue = (orders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

  const { data: expenses, error: expensesError } = await supabase.from('shop_expenses')
    .select('*')
    .eq('shop_id', shopId)
    .gte('expense_date', period + '-01')
    .lte('expense_date', period + '-31');

  if (expensesError) throw expensesError;

  const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const { error: upsertError } = await supabase.from('shop_accounting_periods').upsert({
    shop_id: shopId,
    period,
    revenue,
    expenses: totalExpenses,
    profit: revenue - totalExpenses,
    updated_at: new Date().toISOString()
  }, { onConflict: 'shop_id,period' });

  if (upsertError) throw upsertError;

  return { revenue, expenses: totalExpenses, profit: revenue - totalExpenses };
}
