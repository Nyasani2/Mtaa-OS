import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface WithdrawalRequest {
  amount: number;
  currency?: string;
  destinationAccount?: string;
  provider?: string;
  reason?: string;
}

export interface WithdrawalResult {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
}

/**
 * Initiate a wallet withdrawal
 */
export async function initiateWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResult> {
  const { user } = useAuthStore.getState();
  if (!user) {
    return { success: false, message: 'You must be signed in to make a withdrawal' };
  }

  try {
    // Get user's default wallet account
    const { data: account, error: accountErr } = await supabase
      .from('wallet_accounts')
      .select('id, wallet_id, currency, balance, available_balance')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (accountErr || !account) {
      return { success: false, message: 'No default wallet account found.' };
    }

    if (account.available_balance < request.amount) {
      return { success: false, message: `Insufficient funds. Available: ${account.available_balance} ${account.currency}` };
    }

    // Create withdrawal transaction
    const { data: txn, error: txnErr } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        wallet_id: account.wallet_id,
        account_id: account.id,
        amount: -Math.abs(request.amount),
        currency: request.currency || account.currency || 'USD',
        type: 'withdrawal',
        status: 'pending',
        description: request.reason || `Withdrawal to ${request.destinationAccount || 'external'}`,
        reference: `WTH-${Date.now()}`,
        metadata: {
          destination_account: request.destinationAccount,
          provider: request.provider,
        },
        provider: request.provider || 'manual',
      })
      .select()
      .single();

    if (txnErr) throw txnErr;

    // Hold the balance
    const { error: holdErr } = await supabase.rpc('wallet_hold_balance', {
      p_account_id: account.id,
      p_amount: request.amount,
    });

    if (holdErr) {
      // Rollback
      await supabase.from('wallet_transactions').delete().eq('id', txn.id);
      throw holdErr;
    }

    return {
      success: true,
      transactionId: txn.id,
      message: `Withdrawal of ${request.amount} initiated. Transaction ID: ${txn.id}`,
    };
  } catch (err: any) {
    console.error('Withdrawal error:', err);
    return { success: false, message: 'Withdrawal failed', error: err.message };
  }
}

/**
 * Get withdrawal history
 */
export async function getWithdrawalHistory(limit: number = 20): Promise<any[]> {
  const { user } = useAuthStore.getState();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error('Get withdrawal history error:', err);
    return [];
  }
}
