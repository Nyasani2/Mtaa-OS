// lib/shop/services/accountingService.ts
import { supabase } from "@/lib/supabase/client";
import { ShopAccount, ShopExpense, ShopJournalEntry } from "../types";

export class AccountingService {
  static async getAccounts(shopId: string): Promise<ShopAccount[]> {
    const { data, error } = await supabase.from("shop_accounts").select("*").eq("shop_id", shopId).order("code");
    if (error) throw error;
    return data || [];
  }

  static async createJournalEntry(shopId: string, entry: {
    date: string;
    description: string;
    lines: { account_id: string; debit: number; credit: number; description?: string }[];
  }): Promise<any> {
    const totalDebit = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error("Journal entry must balance");

    const entryNumber = `JE-${Date.now()}`;
    const { data: journalEntry, error: entryError } = await supabase.from("shop_journal_entries").insert({
      shop_id: shopId,
      entry_number: entryNumber,
      date: entry.date,
      description: entry.description,
      total_debit: totalDebit,
      total_credit: totalCredit,
    }).select().single();

    if (entryError) throw entryError;

    const lines = entry.lines.map(l => ({
      journal_entry_id: journalEntry.id,
      account_id: l.account_id,
      description: l.description,
      debit: l.debit || 0,
      credit: l.credit || 0,
    }));

    const { error: linesError } = await supabase.from("shop_journal_lines").insert(lines);
    if (linesError) throw linesError;

    // Update account balances
    for (const line of entry.lines) {
      const { data: account } = await supabase.from("shop_accounts").select("current_balance, type").eq("id", line.account_id).single();
      const change = (line.debit || 0) - (line.credit || 0);
      const multiplier = ["asset", "expense"].includes(account.type) ? 1 : -1;
      await supabase.from("shop_accounts").update({
        current_balance: account.current_balance + (change * multiplier),
      }).eq("id", line.account_id);
    }

    return journalEntry;
  }

  static async getJournalEntries(shopId: string, startDate?: string, endDate?: string): Promise<any[]> {
    let query = supabase.from("shop_journal_entries").select("*, lines:shop_journal_lines(*, account:account_id(code, name))").eq("shop_id", shopId);
    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    const { data, error } = await query.order("date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createExpense(expense: Partial<ShopExpense>): Promise<ShopExpense> {
    const { data, error } = await supabase.from("shop_expenses").insert(expense).select().single();
    if (error) throw error;

    // Auto-create journal entry for expense
    const accounts = await this.getAccounts(expense.shop_id!);
    const expenseAccount = accounts.find(a => a.sub_type === expense.category);
    const cashAccount = accounts.find(a => a.sub_type === "cash");

    if (expenseAccount && cashAccount) {
      await this.createJournalEntry(expense.shop_id!, {
        date: expense.expense_date!,
        description: expense.description || `Expense: ${expense.category}`,
        lines: [
          { account_id: expenseAccount.id, debit: expense.total_amount!, credit: 0 },
          { account_id: cashAccount.id, debit: 0, credit: expense.total_amount! },
        ],
      });
    }

    return data;
  }

  static async getExpenses(shopId: string, startDate?: string, endDate?: string): Promise<ShopExpense[]> {
    let query = supabase.from("shop_expenses").select("*").eq("shop_id", shopId);
    if (startDate) query = query.gte("expense_date", startDate);
    if (endDate) query = query.lte("expense_date", endDate);
    const { data, error } = await query.order("expense_date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getProfitLoss(shopId: string, startDate: string, endDate: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke("shop-accounting-sync", {
      body: { action: "profit_loss", shop_id: shopId, start_date: startDate, end_date: endDate },
    });
    if (error) throw error;
    return data;
  }

  static async getBalanceSheet(shopId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke("shop-accounting-sync", {
      body: { action: "balance_sheet", shop_id: shopId },
    });
    if (error) throw error;
    return data;
  }
}
