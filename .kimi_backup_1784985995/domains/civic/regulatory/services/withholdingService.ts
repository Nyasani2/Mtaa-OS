import { supabase } from '@/lib/supabase/client';
import { JURISDICTIONS, type JurisdictionConfig } from '../config/jurisdictions';

export interface WithholdingPayload {
  transactionId: string;
  transactionType: 'mtaxi_ride' | 'mtruck_delivery' | 'boda_ride' | 'shop_sale' | 'restaurant_order' | 'creator_earning';
  taxpayerId: string;
  baseAmount: number;
  jurisdictionCode: string;
  currency?: string;
}

/**
 * Calculate and record tax withholding at transaction time.
 * Called by MTaxi, MTruck, Boda, Shop, Restaurant, and Creator payment flows.
 */
export async function calculateWithholding(payload: WithholdingPayload): Promise<{
  withholdingId: string;
  amount: number;
  taxRate: number;
  currency: string;
}> {
  const jurisdiction = JURISDICTIONS[payload.jurisdictionCode];
  if (!jurisdiction) {
    throw new Error(`Unknown jurisdiction: ${payload.jurisdictionCode}`);
  }

  const taxRate = jurisdiction.taxRate;
  const currency = payload.currency || jurisdiction.currency;
  const amount = Math.round(payload.baseAmount * taxRate * 100) / 100;

  // Insert withholding record
  const { data, error } = await supabase
    .from('tax_withholdings')
    .insert({
      transaction_id: payload.transactionId,
      transaction_type: payload.transactionType,
      taxpayer_id: payload.taxpayerId,
      base_amount: payload.baseAmount,
      amount,
      tax_rate: taxRate,
      currency,
      jurisdiction_code: payload.jurisdictionCode,
      authority_wallet_id: jurisdiction.authorityWalletId,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Deduct from taxpayer wallet
  const { error: walletError } = await supabase.rpc('deduct_tax_from_wallet', {
    p_user_id: payload.taxpayerId,
    p_amount: amount,
    p_currency: currency,
    p_reference_id: data.id,
    p_description: `${jurisdiction.authorityName} withholding tax on ${payload.transactionType}`,
  });

  if (walletError) {
    // Rollback withholding if wallet deduction fails
    await supabase.from('tax_withholdings').delete().eq('id', data.id);
    throw walletError;
  }

  return {
    withholdingId: data.id,
    amount,
    taxRate,
    currency,
  };
}

/**
 * Remit all pending withholdings for a jurisdiction to the authority wallet.
 * Called by cron job or manual remittance action.
 */
export async function remitWithholdings(jurisdictionCode: string): Promise<{
  remittedCount: number;
  totalAmount: number;
}> {
  const jurisdiction = JURISDICTIONS[jurisdictionCode];
  if (!jurisdiction) throw new Error(`Unknown jurisdiction: ${jurisdictionCode}`);

  // Get all pending withholdings
  const { data: pending, error: fetchError } = await supabase
    .from('tax_withholdings')
    .select('*')
    .eq('jurisdiction_code', jurisdictionCode)
    .eq('status', 'pending');

  if (fetchError) throw fetchError;
  if (!pending || pending.length === 0) {
    return { remittedCount: 0, totalAmount: 0 };
  }

  const totalAmount = pending.reduce((sum, w) => sum + w.amount, 0);
  const currency = pending[0].currency;

  // Transfer to authority wallet
  const { error: transferError } = await supabase.rpc('transfer_to_authority_wallet', {
    p_authority_wallet_id: jurisdiction.authorityWalletId,
    p_amount: totalAmount,
    p_currency: currency,
    p_description: `Tax remittance ${jurisdictionCode} — ${pending.length} transactions`,
  });

  if (transferError) throw transferError;

  // Mark all as remitted
  const ids = pending.map((w) => w.id);
  const { error: updateError } = await supabase
    .from('tax_withholdings')
    .update({
      status: 'remitted',
      remitted_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (updateError) throw updateError;

  return { remittedCount: pending.length, totalAmount };
}

/**
 * Get withholding summary for a date range.
 */
export async function getWithholdingSummary(
  taxpayerId: string,
  jurisdictionCode: string,
  startDate: string,
  endDate: string
): Promise<{
  totalBase: number;
  totalWithheld: number;
  remitted: number;
  pending: number;
  byType: Record<string, { count: number; amount: number }>;
}> {
  const { data, error } = await supabase
    .from('tax_withholdings')
    .select('*')
    .eq('taxpayer_id', taxpayerId)
    .eq('jurisdiction_code', jurisdictionCode)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  const byType: Record<string, { count: number; amount: number }> = {};
  let totalBase = 0;
  let totalWithheld = 0;
  let remitted = 0;
  let pending = 0;

  (data || []).forEach((w: any) => {
    totalBase += w.base_amount || 0;
    totalWithheld += w.amount || 0;
    if (w.status === 'remitted') remitted += w.amount;
    else pending += w.amount;

    const type = w.transaction_type;
    if (!byType[type]) byType[type] = { count: 0, amount: 0 };
    byType[type].count++;
    byType[type].amount += w.amount;
  });

  return { totalBase, totalWithheld, remitted, pending, byType };
}
