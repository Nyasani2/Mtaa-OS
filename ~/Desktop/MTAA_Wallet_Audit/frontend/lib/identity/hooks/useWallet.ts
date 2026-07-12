import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export interface WalletBalance {
  id?: string;
  user_id?: string;
  available: number;
  escrow: number;
  pending: number;
  currency: string;
  status: 'active' | 'frozen' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'escrow' | 'release' | 'refund' | 'transfer' | 'fee';
  amount: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EscrowAccount {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'released' | 'disputed' | 'refunded';
  release_conditions?: Record<string, any>;
  created_at: string;
  released_at?: string;
}

export interface WalletState {
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  escrows: EscrowAccount[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

// ============================================
// SINGLE SOURCE OF TRUTH
// ============================================

const WALLET_CACHE = new Map<string, { data: WalletState; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds
const SUBSCRIBERS = new Set<(state: WalletState) => void>();
let GLOBAL_STATE: WalletState = {
  balance: null,
  transactions: [],
  escrows: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
};

function notifySubscribers() {
  SUBSCRIBERS.forEach(cb => cb({ ...GLOBAL_STATE }));
}

function updateGlobalState(partial: Partial<WalletState>) {
  GLOBAL_STATE = { ...GLOBAL_STATE, ...partial };
  notifySubscribers();
}

// ============================================
// CORE FUNCTIONS (can be called outside hooks)
// ============================================

export async function getWalletBalance(userId?: string): Promise<WalletBalance | null> {
  const targetId = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!targetId) return null;

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', targetId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No wallet exists — auto-create one
      return createWallet(targetId);
    }
    console.error('[getWalletBalance] error:', error);
    return null;
  }

  return data;
}

export async function createWallet(userId: string): Promise<WalletBalance | null> {
  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      available: 0,
      escrow: 0,
      pending: 0,
      currency: 'KES',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('[createWallet] error:', error);
    return null;
  }

  return data;
}

export async function getTransactions(userId?: string, limit = 20): Promise<WalletTransaction[]> {
  const targetId = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getTransactions] error:', error);
    return [];
  }

  return data || [];
}

export async function getEscrows(userId?: string): Promise<EscrowAccount[]> {
  const targetId = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('escrow_accounts')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getEscrows] error:', error);
    return [];
  }

  return data || [];
}

export async function refreshWallet(userId?: string): Promise<WalletState> {
  updateGlobalState({ isRefreshing: true, error: null });

  try {
    const [balance, transactions, escrows] = await Promise.all([
      getWalletBalance(userId),
      getTransactions(userId, 50),
      getEscrows(userId),
    ]);

    const newState: WalletState = {
      balance,
      transactions,
      escrows,
      isLoading: false,
      isRefreshing: false,
      error: null,
    };

    updateGlobalState(newState);
    return newState;
  } catch (err: any) {
    updateGlobalState({ isRefreshing: false, error: err.message });
    return { ...GLOBAL_STATE };
  }
}

// ============================================
// TRANSACTION OPERATIONS
// ============================================

export async function deposit(amount: number, description: string, metadata?: Record<string, any>): Promise<WalletTransaction | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('wallet_deposit', {
    p_user_id: user.user.id,
    p_amount: amount,
    p_description: description,
    p_metadata: metadata || {},
  });

  if (error) {
    console.error('[deposit] error:', error);
    throw error;
  }

  // Refresh after transaction
  await refreshWallet();
  return data;
}

export async function withdraw(amount: number, description: string, metadata?: Record<string, any>): Promise<WalletTransaction | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('wallet_withdraw', {
    p_user_id: user.user.id,
    p_amount: amount,
    p_description: description,
    p_metadata: metadata || {},
  });

  if (error) {
    console.error('[withdraw] error:', error);
    throw error;
  }

  await refreshWallet();
  return data;
}

export async function transfer(toUserId: string, amount: number, description: string): Promise<WalletTransaction | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('wallet_transfer', {
    p_from_user_id: user.user.id,
    p_to_user_id: toUserId,
    p_amount: amount,
    p_description: description,
  });

  if (error) {
    console.error('[transfer] error:', error);
    throw error;
  }

  await refreshWallet();
  return data;
}

export async function createEscrow(amount: number, releaseConditions: Record<string, any>, description: string): Promise<EscrowAccount | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('wallet_create_escrow', {
    p_user_id: user.user.id,
    p_amount: amount,
    p_release_conditions: releaseConditions,
    p_description: description,
  });

  if (error) {
    console.error('[createEscrow] error:', error);
    throw error;
  }

  await refreshWallet();
  return data;
}

// ============================================
// REACT HOOK (for components)
// ============================================

export function useWallet(userId?: string) {
  const [state, setState] = useState<WalletState>({ ...GLOBAL_STATE });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    SUBSCRIBERS.add(setState);

    // Initial load if not cached
    const cached = WALLET_CACHE.get(userId || 'self');
    if (!cached || Date.now() - cached.timestamp > CACHE_TTL) {
      refreshWallet(userId);
    }

    return () => {
      isMounted.current = false;
      SUBSCRIBERS.delete(setState);
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    return refreshWallet(userId);
  }, [userId]);

  const depositFn = useCallback(async (amount: number, description: string) => {
    return deposit(amount, description);
  }, []);

  const withdrawFn = useCallback(async (amount: number, description: string) => {
    return withdraw(amount, description);
  }, []);

  const transferFn = useCallback(async (toUserId: string, amount: number, description: string) => {
    return transfer(toUserId, amount, description);
  }, []);

  return {
    ...state,
    refresh,
    deposit: depositFn,
    withdraw: withdrawFn,
    transfer: transferFn,
    getBalance: () => getWalletBalance(userId),
    getTransactions: () => getTransactions(userId),
    getEscrows: () => getEscrows(userId),
  };
}

// ============================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================

// For old code still calling useWalletBalance()
export function useWalletBalance(userId?: string) {
  const { balance, isLoading, refresh } = useWallet(userId);
  return { balance, isLoading, refresh };
}

// For old code still calling useWalletTransactions()
export function useWalletTransactions(userId?: string, limit = 20) {
  const { transactions, isLoading, refresh } = useWallet(userId);
  return { transactions: transactions.slice(0, limit), isLoading, refresh };
}

// For old code still calling useStreetsWallet()
export function useStreetsWallet() {
  return useWallet();
}

// Default export
export default useWallet;
