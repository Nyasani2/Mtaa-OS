import { supabase } from '@/lib/supabase';

export async function getWalletTransactions(userId: string) {
  const { data } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

export async function depositToWallet(userId: string, amount: number, description?: string, metadata?: any, method?: string) {
  const { error } = await supabase.from('wallet_transactions').insert({
    user_id: userId,
    amount,
    type: 'credit',
    status: 'pending_provider_verification', // SECURITY: Client cannot mark as completed
    description: description || `Deposit via ${method || 'unknown'}`,
    currency: 'KES',
    metadata: metadata || {},
  });
  return !error;
}

// ───────────────────────────────────────────────
// REAL DATABASE IMPLEMENTATIONS
// ───────────────────────────────────────────────

export async function getBalance(userId: string) {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('balance, id, currency')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  
  if (error) {
    console.error('[getBalance] Error:', error);
    return { balance: 0, held_balance: 0, available: 0, wallet_id: null, currency: 'KES' };
  }
  
  return { 
    balance: data?.balance || 0, 
    held_balance: 0,
    available: data?.balance || 0,
    wallet_id: data?.id,
    currency: data?.currency || 'KES'
  };
}

export async function ensureWallet(userId: string, currency = 'KES') {
  const existing = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  
  if (existing.data) return existing.data;
  
  const { data, error } = await supabase
    .from('wallet_accounts')
    .insert({ 
      user_id: userId, 
      balance: 0, 
      currency, 
      is_default: true, 
      status: 'active',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('[ensureWallet] Error:', error);
    throw error;
  }
  return data;
}

export async function getTransactions(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[getTransactions] Error:', error);
    return [];
  }
  return data || [];
}

export async function getWalletAccountByUserId(userId: string) {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  
  if (error) {
    console.error('[getWalletAccountByUserId] Error:', error);
    return null;
  }
  return data;
}

export async function createWalletTransaction(payload: any) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
      currency: payload.currency || 'KES'
    })
    .select()
    .single();
  
  if (error) {
    console.error('[createWalletTransaction] Error:', error);
    throw error;
  }
  return data;
}

// Delegate to domains/wallet/services/walletService.ts for complex operations
export async function sendMoney(p: any) { 
  try {
    const { sendMoney: realSend } = (await import('@/domains/wallet/services/walletService')) as any;
    return realSend(p.senderId || p.user_id, p);
  } catch (e) {
    console.error('[sendMoney] Delegation error:', e);
    return { success: false, error: 'Send failed' };
  }
}

export async function createReceiveRequest(p: any) { 
  try {
    const { createReceiveRequest: realReq } = (await import('@/domains/wallet/services/walletService')) as any;
    return realReq(p.user_id, p);
  } catch (e) {
    console.error('[createReceiveRequest] Delegation error:', e);
    return { success: false, error: 'Request failed' };
  }
}

export async function initiateDeposit(p: any) { 
  try {
    const { initiateDeposit: realDep } = (await import('@/domains/wallet/services/walletService')) as any;
    return realDep(p.user_id, p.amount, p.provider, p.providerRef);
  } catch (e) {
    console.error('[initiateDeposit] Delegation error:', e);
    return { success: false, error: 'Deposit failed' };
  }
}

export async function initiateWithdrawal(p: any) { 
  try {
    const { initiateWithdrawal: realWith} = (await import('@/domains/wallet/services/walletService')) as any;
    return realWith(p.user_id, p.amount, p.provider, p.accountRef);
  } catch (e) {
    console.error('[initiateWithdrawal] Delegation error:', e);
    return { success: false, error: 'Withdrawal failed' };
  }
}

export const walletService = { 
  sendMoney, 
  getBalance, 
  ensureWallet, 
  getTransactions,
  getWalletAccountByUserId,
  createWalletTransaction
};

// === AUTO-PATCHED SERVICE EXPORTS ===
