/**
 * MTAA ASIS — Wallet Assistant
 * Produces actionable suggestions for a user based on their real wallet
 * activity (low balance, unusual spending, savings opportunities).
 *
 * Replaces the previous placeholder implementation, which returned an
 * empty array unconditionally.
 */
import { supabase } from '@/lib/supabase';

export interface WalletSuggestion {
  type: 'low_balance' | 'spending_spike' | 'savings_opportunity' | 'inactive_wallet';
  message: string;
  severity: 'info' | 'warning';
}

const LOW_BALANCE_THRESHOLD = 100; // KES
const SPENDING_SPIKE_MULTIPLIER = 2.5; // vs. trailing 30-day average

export class WalletAssistant {
  async suggest(userId: string): Promise<WalletSuggestion[]> {
    if (!userId) return [];
    const suggestions: WalletSuggestion[] = [];

    const { data: wallet } = await supabase
      .from("wallet_accounts")
      .select('id, balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet) return [];

    if (Number(wallet.balance) < LOW_BALANCE_THRESHOLD) {
      suggestions.push({
        type: 'low_balance',
        message: `Your wallet balance is below ${LOW_BALANCE_THRESHOLD}. Consider topping up.`,
        severity: 'warning',
      });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: monthTx } = await supabase
      .from('wallet_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo);

    if (monthTx && monthTx.length > 0) {
      const spend = (rows: typeof monthTx) =>
        rows.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

      const totalSpend30d = spend(monthTx);
      const recentSpend7d = spend(monthTx.filter((t) => t.created_at >= sevenDaysAgo));
      const avgWeeklySpend = totalSpend30d / (30 / 7);

      if (avgWeeklySpend > 0 && recentSpend7d > avgWeeklySpend * SPENDING_SPIKE_MULTIPLIER) {
        suggestions.push({
          type: 'spending_spike',
          message: `Your spending this week (${recentSpend7d.toFixed(0)}) is significantly higher than your usual weekly average (${avgWeeklySpend.toFixed(0)}).`,
          severity: 'info',
        });
      }
    } else {
      suggestions.push({
        type: 'inactive_wallet',
        message: 'No wallet activity in the last 30 days.',
        severity: 'info',
      });
    }

    return suggestions;
  }
}

