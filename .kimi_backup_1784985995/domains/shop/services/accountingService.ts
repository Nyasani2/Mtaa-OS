import { supabase } from '@/lib/supabase';
import { ShopAccount, ShopExpense } from '../types';

export class AccountingService {
  static async getAccounts(shopId: string): Promise<ShopAccount[]> {
    const { data, error } = await supabase.from('shop_accounts').select('*').eq('shop_id', shopId);
    if (error) throw error;
    return data || [];
  }

  static async getExpenses(shopId: string): Promise<ShopExpense[]> {
    const { data, error } = await supabase.from('shop_expenses').select('*').eq('shop_id', shopId);
    if (error) throw error;
    return data || [];
  }

  static async getProfitLoss(shopId: string, startDate: string, endDate: string): Promise<{ revenue: number; expenses: number; profit: number }> {
    const { data: revenue } = await supabase.from('shop_orders')
      .select('total_amount')
      .eq('shop_id', shopId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'delivered');
    const { data: expenses } = await supabase.from('shop_expenses')
      .select('amount')
      .eq('shop_id', shopId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);
    const totalRevenue = (revenue || []).reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    return { revenue: totalRevenue, expenses: totalExpenses, profit: totalRevenue - totalExpenses };
  }

  static async createAccount(data: Partial<ShopAccount>): Promise<ShopAccount> {
    const { data: result, error } = await supabase.from('shop_accounts').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async updateAccount(id: string, data: Partial<ShopAccount>): Promise<ShopAccount> {
    const { data: result, error } = await supabase.from('shop_accounts').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  static async createExpense(data: Partial<ShopExpense>): Promise<ShopExpense> {
    const { data: result, error } = await supabase.from('shop_expenses').insert(data).select().single();
    if (error) throw error;
    return result;
  }
}
