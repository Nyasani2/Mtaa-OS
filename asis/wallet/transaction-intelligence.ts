/**
 * MTAA ASIS — Transaction Intelligence
 * Generates insight events from a user's real transaction history when
 * their wallet balance changes (wired to wallet:balance:updated).
 */
import { supabase } from '@/lib/supabase';
import { WalletAssistant } from './wallet-assistant';

export interface Insight {
  type: string;
  message: string;
}

type BridgeMemory = { retrieve: (key?: string) => Promise<Insight[]> };
type BridgeBus = {
  on: (event: string, cb: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
};

export class TransactionIntelligence {
  constructor(
    private assistant: WalletAssistant,
    private memory: BridgeMemory,
    private bus: BridgeBus
  ) {}

  async generateInsights(userId: string): Promise<Insight[]> {
    if (!userId) return [];
    const insights: Insight[] = [];

    const suggestions = await this.assistant.suggest(userId);
    for (const s of suggestions) {
      insights.push({ type: s.type, message: s.message });
    }

    // Category breakdown for the last 30 days, if reference_type is populated.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tx } = await supabase
      .from('wallet_transactions')
      .select('amount, type, reference_type')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo);

    if (tx && tx.length > 0) {
      const byType = new Map<string, number>();
      for (const t of tx) {
        const key = t.reference_type || t.type || 'other';
        byType.set(key, (byType.get(key) || 0) + Math.abs(Number(t.amount || 0)));
      }
      const sorted = [...byType.entries()].sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const [topCategory, topAmount] = sorted[0];
        insights.push({
          type: 'top_spending_category',
          message: `Your largest transaction category this month is "${topCategory}" at ${topAmount.toFixed(0)}.`,
        });
      }
    }

    return insights;
  }
}
