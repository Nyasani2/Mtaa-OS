import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  available_balance: number;
  currency: string;
  wallet_name: string;
  account_id: string;
  is_frozen: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  transaction_type: string;
  direction: string;
  amount: number;
  currency: string;
  balance_after: number;
  status: string;
  reference: string;
  description: string;
  metadata: any;
  created_at: string;
}

export interface RecentContact {
  name: string;
  phone?: string;
  walletId?: string;
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletId, setWalletId] = useState<string>('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed properties that screens expect
  const balance = wallet?.balance || 0;
  const availableBalance = wallet?.available_balance || 0;

  // Mock recent contacts - replace with real data fetch later
  const recentContacts: RecentContact[] = [];

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            available_balance: 0,
            currency: 'KES',
            wallet_name: 'Main Wallet',
            account_id: `WAL-${user.id.slice(0, 8)}`,
            is_frozen: false,
          })
          .select()
          .single();

        if (createError) {
          setError(createError.message);
          setLoading(false);
          return;
        }

        setWallet(newWallet);
        setWalletId(newWallet.id);
      } else {
        setWallet(walletData);
        setWalletId(walletData.id);
      }

      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(txData || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }

  async function deposit(amount: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.rpc('wallet_deposit', {
        wallet: walletId,
        amount: amount,
      });

      if (error) throw error;
      await loadWallet();
      return result;
    } catch (err: any) {
      throw new Error(err?.message || 'Deposit failed');
    }
  }

  async function withdraw(amount: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.rpc('wallet_withdraw', {
        p_user: user.id,
        p_amount: amount,
      });

      if (error) throw error;
      await loadWallet();
      return result;
    } catch (err: any) {
      throw new Error(err?.message || 'Withdrawal failed');
    }
  }

  async function transfer(receiverWalletId: string, amount: number, description?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.rpc('wallet_transfer', {
        p_sender_wallet_id: walletId,
        p_recipient_wallet_id: receiverWalletId,
        p_amount: amount,
        p_description: description || 'Wallet transfer',
      });

      if (error) throw error;
      await loadWallet();
      return result;
    } catch (err: any) {
      throw new Error(err?.message || 'Transfer failed');
    }
  }

  // Alias methods that screens expect
  const sendMoney = async (params: { recipient: string; amount: number; note?: string }) => {
    // Try to resolve recipient to wallet ID
    let receiverId = params.recipient;

    // If recipient looks like a phone number, try to find user
    if (params.recipient.match(/^\d/)) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', params.recipient)
        .single();
      if (userData) {
        const { data: receiverWallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', userData.id)
          .single();
        if (receiverWallet) receiverId = receiverWallet.id;
      }
    }

    return transfer(receiverId, params.amount, params.note);
  };

  return {
    wallet,
    walletId,
    transactions,
    loading,
    error,
    // Computed properties
    balance,
    availableBalance,
    // Alias methods for screen compatibility
    deposit,
    withdraw: async (params: { method: string; amount: number; recipient: string }) => {
      // Withdraw to external method (mpesa/bank/crypto)
      const { data: result, error } = await supabase.rpc('wallet_withdraw_external', {
        p_wallet_id: walletId,
        p_amount: params.amount,
        p_method: params.method,
        p_recipient: params.recipient,
      });
      if (error) throw error;
      await loadWallet();
      return result;
    },
    transfer,
    sendMoney,
    recentContacts,
    refresh: loadWallet,
  };
}
