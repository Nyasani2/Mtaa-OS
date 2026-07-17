// lib/wallet/hooks/useWallet.ts
// Canonical wallet hook — reads from wallets table, uses verified RPCs

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: string;
  wallet_name?: string;
  wallet_type?: string;
}

export function useWallet() {
  const user = useAuthStore((s) => s.user);

  const getWallet = useCallback(async (): Promise<WalletData | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.error('[useWallet] getWallet error:', error);
      return null;
    }
    return data;
  }, [user?.id]);

  const getBalance = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0;
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (error || !data) return 0;
    return data.balance || 0;
  }, [user?.id]);

  const transfer = useCallback(async (
    amount: number,
    recipientPhone: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    // Find recipient by phone
    const { data: recipient } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', recipientPhone)
      .single();

    if (!recipient?.id) {
      return { success: false, error: 'Recipient not found' };
    }

    const { error } = await supabase.rpc('wallet_send', {
      p_sender: user.id,
      p_receiver: recipient.id,
      p_amount: amount
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, [user?.id]);

  return { getWallet, getBalance, transfer, userId: user?.id };
}

export function useWalletAccount() {
  const user = useAuthStore((s) => s.user);

  const getAccount = useCallback(async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error) return null;
    return {
      ...data,
      available_balance: (data?.balance || 0) - (data?.held_balance || 0)
    };
  }, [user?.id]);

  return { getAccount, userId: user?.id };
}

export default useWallet;
