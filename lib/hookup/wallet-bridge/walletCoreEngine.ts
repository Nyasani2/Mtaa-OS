import { supabase } from '@/lib/supabase';

export class WalletCoreEngine {
  async processQR(data: string) {
    return { success: true, data };
  }

  async processTransfer(payload: { fromUserId: string; toUserId: string; amount: number }) {
    const { error } = await supabase.rpc('wallet_send', {
      p_sender: payload.fromUserId,
      p_receiver: payload.toUserId,
      p_amount: payload.amount
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, transactionId: "tx-" + Date.now() };
  }

  async getBalance(userId: string) {
    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('balance, currency')
      .eq('user_id', userId)
      .single();
    if (error || !data) {
      return { balance: 0, currency: "KES" };
    }
    return { balance: data.balance || 0, currency: data.currency || "KES" };
  }
}
