// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface ConversionRequest {
  userId: string;
  amountKES: number;
  binanceEmail?: string;
  destinationAddress?: string;
  destinationNetwork?: string;
}

export interface ConversionResult {
  success: boolean;
  conversionId?: string;
  usdtReceived?: number;
  mtaaFee?: number;
  networkFee?: number;
  error?: string;
}

const MTAA_TREASURY_FEE_PERCENT = 0.02; // 2%
const NETWORK_FEE_USD = 1.00; // $1 flat network fee
const EXCHANGE_RATE_KES_USD = 130; // 1 USD = 130 KES (Mocked, replace with live API later)

export async function processKesToUsdtConversion(req: ConversionRequest): Promise<ConversionResult> {
  try {
    // 1. Calculate Fees and Final Amount
    const mtaaFee = req.amountKES * MTAA_TREASURY_FEE_PERCENT;
    const netKes = req.amountKES - mtaaFee;
    const grossUsd = netKes / EXCHANGE_RATE_KES_USD;
    const finalUsd = grossUsd - NETWORK_FEE_USD;

    if (finalUsd <= 0) {
      return { success: false, error: 'Amount too low to cover fees.' };
    }

    // 2. Call Atomic RPC to Debit User's KES Wallet
    const { data: rpcData, error: rpcError } = await supabase.rpc('mtaa_wallet_debit', {
      p_user_id: req.userId,
      p_amount: req.amountKES,
      p_currency: 'KES',
      p_description: `Crypto Conversion: KES to USDT (MTAA Fee: ${mtaaFee.toFixed(2)})`,
      p_transaction_type: 'crypto_conversion',
      p_metadata: { mtaa_fee: mtaaFee, network_fee_usd: NETWORK_FEE_USD, exchange_rate: EXCHANGE_RATE_KES_USD }
    });

    if (rpcError || !rpcData?.success) {
      return { success: false, error: rpcError?.message || rpcData?.error || 'Wallet debit failed.' };
    }

    // 3. Insert Record into binance_conversions table
    const { data: conversion, error: insertError } = await supabase
      .from('binance_conversions')
      .insert({
        user_id: req.userId,
        wallet_id: rpcData.wallet_id,
        from_currency: 'KES',
        from_amount: req.amountKES,
        exchange_rate: EXCHANGE_RATE_KES_USD,
        to_currency: 'USDT',
        to_amount: finalUsd,
        conversion_fee: mtaaFee,
        network_fee: NETWORK_FEE_USD,
        total_fees: mtaaFee + (NETWORK_FEE_USD * EXCHANGE_RATE_KES_USD), // Total fees in KES equivalent
        status: 'completed',
        binance_email: req.binanceEmail || null,
        destination_address: req.destinationAddress || null,
        destination_network: req.destinationNetwork || null,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      // In a real production app, we would trigger a compensating transaction (refund) here.
      console.error('Failed to log conversion:', insertError);
      return { success: false, error: 'Conversion logged failed. Contact support.' };
    }

    return {
      success: true,
      conversionId: conversion.id,
      usdtReceived: finalUsd,
      mtaaFee,
      networkFee: NETWORK_FEE_USD
    };

  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error during conversion.' };
  }
}
