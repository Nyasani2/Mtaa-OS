// asis/wallet/wallet-assistant.ts
// ASIS Wallet Assistant
// Imported by: lib/system/adapters/asis-adapter.ts

import { supabase } from '@/lib/supabase';

export interface AssistantQuery {
  userId: string;
  query: string;
  context?: Record<string, any>;
}

export interface AssistantResponse {
  answer: string;
  suggestions: string[];
  actions: AssistantAction[];
  confidence: number;
}

export interface AssistantAction {
  label: string;
  type: 'navigate' | 'execute' | 'confirm';
  payload?: any;
}

export class WalletAssistant {
  /**
   * Process a natural language query about wallet
   */
  async processQuery(query: AssistantQuery): Promise<AssistantResponse> {
    const q = query.query.toLowerCase();

    // Balance inquiry
    if (q.includes('balance') || q.includes('how much')) {
      const { data: wallet } = await supabase
        .from('wallet_accounts')
        .select('balance, currency')
        .eq('user_id', query.userId)
        .single();

      return {
        answer: `Your current balance is ${wallet?.currency || 'KES'} ${(wallet?.balance || 0).toLocaleString()}.`,
        suggestions: ['View transactions', 'Add money', 'Send money'],
        actions: [
          { label: 'View Transactions', type: 'navigate', payload: { screen: 'wallet/history' } },
          { label: 'Add Money', type: 'navigate', payload: { screen: 'wallet/deposit' } },
        ],
        confidence: 0.95,
      };
    }

    // Transaction history
    if (q.includes('transaction') || q.includes('history') || q.includes('recent')) {
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', query.userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const recent = (txs || []).map((tx: any) =>
        `${tx.type}: ${tx.currency || 'KES'} ${Math.abs(tx.amount || 0).toLocaleString()}`
      ).join(', ');

      return {
        answer: `Your recent transactions: ${recent || 'None found'}.`,
        suggestions: ['View all transactions', 'Download statement', 'Filter by date'],
        actions: [
          { label: 'View All', type: 'navigate', payload: { screen: 'wallet/transactions' } },
        ],
        confidence: 0.9,
      };
    }

    // Send money
    if (q.includes('send') || q.includes('transfer') || q.includes('pay')) {
      return {
        answer: 'I can help you send money. Who would you like to send to and how much?',
        suggestions: ['Send to contact', 'Send to phone number', 'Pay bill'],
        actions: [
          { label: 'Send Money', type: 'navigate', payload: { screen: 'wallet/transfer' } },
          { label: 'Scan QR', type: 'navigate', payload: { screen: 'wallet/qr-scan' } },
        ],
        confidence: 0.85,
      };
    }

    // Deposit
    if (q.includes('deposit') || q.includes('add money') || q.includes('top up')) {
      return {
        answer: 'You can add money via M-Pesa, bank transfer, or card. Which method would you prefer?',
        suggestions: ['M-Pesa', 'Bank Transfer', 'Card'],
        actions: [
          { label: 'Deposit', type: 'navigate', payload: { screen: 'wallet/deposit' } },
        ],
        confidence: 0.9,
      };
    }

    // Default
    return {
      answer: "I'm your wallet assistant. I can help you check your balance, view transactions, send money, or add funds. What would you like to do?",
      suggestions: ['Check balance', 'View transactions', 'Send money', 'Get help'],
      actions: [
        { label: 'Wallet Home', type: 'navigate', payload: { screen: 'wallet' } },
      ],
      confidence: 0.6,
    };
  }

  /**
   * Get personalized wallet tips
   */
  async getTips(userId: string): Promise<string[]> {
    try {
      const { data: wallet } = await supabase
        .from('wallet_accounts')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const tips: string[] = [];

      if ((wallet?.balance || 0) < 500) {
        tips.push('Your balance is running low. Consider adding funds to avoid failed transactions.');
      }

      if ((wallet?.balance || 0) > 50000) {
        tips.push('You have a healthy balance. Consider setting up savings goals.');
      }

      tips.push('Enable notifications to stay updated on all transactions.');
      tips.push('Regularly review your transaction history for security.');

      return tips;
    } catch (e) {
      return ['Keep your PIN secure and never share it.', 'Review your transactions regularly.'];
    }
  }
}

export default WalletAssistant;
