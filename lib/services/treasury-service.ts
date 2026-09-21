// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface DepositRequest {
  userId: string;
  mtaaAmount: number;
  targetCurrency: 'USD' | 'BTC' | 'ETH';
}

export interface TreasuryResult {
  success: boolean;
  mtaaDeducted: number;
  treasuryFee: number;
  usdCredited: number;
  exchangeRate: number;
  transactionId: string;
  error?: string;
}

export class TreasuryService {
  async getLiveRate(base: string, target: string): Promise<number> {
    // In production, replace with real API call (e.g., CoinGecko)
    if (base === 'KES' && target === 'USD') return 130.0;
    return 1.0;
  }

  async processDeposit(request: DepositRequest): Promise<TreasuryResult> {
    const TREASURY_FEE_PERCENT = 0.02; // 2% fee to MTAA Treasury
    try {
      const rate = await this.getLiveRate('KES', 'USD');
      const fee = request.mtaaAmount * TREASURY_FEE_PERCENT;
      const netMtaa = request.mtaaAmount - fee;
      const usdAmount = netMtaa / rate;

      // 1. Deduct from user wallet (Adapt to your actual wallet RPC/function)
      const { error: walletError } = await supabase.rpc('deduct_wallet_balance', {
        p_user_id: request.userId,
        p_amount: request.mtaaAmount,
        p_currency: 'KES'
      });
      if (walletError) throw new Error('Insufficient funds or wallet error');

      // 2. Credit MTAA Treasury
      await supabase.rpc('credit_treasury', {
        p_amount: fee,
        p_currency: 'KES'
      });

      // 3. Credit User Trading Ledger
      const { error: ledgerError } = await supabase.from('trading_ledgers').upsert({
        user_id: request.userId,
        currency: request.targetCurrency,
        balance: supabase.rpc('increment_balance', { p_amount: usdAmount })
      }, { onConflict: 'user_id,currency' });

      if (ledgerError) throw new Error('Failed to update trading ledger');

      // 4. Log Transaction
      const { data: tx } = await supabase.from('treasury_transactions').insert({
        user_id: request.userId,
        type: 'deposit',
        mtaa_amount: request.mtaaAmount,
        usd_amount: usdAmount,
        exchange_rate: rate,
        fee_amount: fee,
        status: 'completed'
      }).select().single();

      return {
        success: true,
        mtaaDeducted: request.mtaaAmount,
        treasuryFee: fee,
        usdCredited: usdAmount,
        exchangeRate: rate,
        transactionId: tx.id
      };
    } catch (error: any) {
      return { success: false, mtaaDeducted: 0, treasuryFee: 0, usdCredited: 0, exchangeRate: 0, transactionId: '', error: error.message };
    }
  }
}
export const treasuryService = new TreasuryService();
