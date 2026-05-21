
import { supabase } from '@/lib/supabase';
import { BinanceConversion, ConversionQuote } from '../types/binance.types';

export async function getCurrentRate(from: string = 'KES', to: string = 'USDT') {
  const { data, error } = await supabase
    .from('binance_rate_history')
    .select('*')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

export async function getQuote(amount: number, from: string = 'KES', to: string = 'USDT'): Promise<ConversionQuote> {
  const rate = await getCurrentRate(from, to);
  const exchangeRate = rate?.rate || 130; // Fallback rate

  // Get config for fees
  const { data: config } = await supabase
    .from('binance_bridge_config')
    .select('*')
    .eq('is_active', true)
    .single();

  const feePercent = config?.conversion_fee_percent || 1.5;
  const networkFee = config?.network_fee_usdt || 1.0;

  const grossAmount = amount / exchangeRate;
  const conversionFee = grossAmount * (feePercent / 100);
  const netAmount = grossAmount - conversionFee - networkFee;

  return {
    fromAmount: amount,
    fromCurrency: from,
    toAmount: Math.max(0, netAmount),
    toCurrency: to,
    exchangeRate,
    conversionFee,
    networkFee,
    totalFees: conversionFee + networkFee,
    netAmount: Math.max(0, netAmount),
  };
}

export async function createConversion(
  userId: string,
  walletId: string,
  fromAmount: number,
  binanceEmail: string,
  destinationAddress: string,
  network: string = 'TRC20'
) {
  const quote = await getQuote(fromAmount);

  const { data, error } = await supabase
    .from('binance_conversions')
    .insert({
      user_id: userId,
      wallet_id: walletId,
      from_currency: 'KES',
      from_amount: fromAmount,
      exchange_rate: quote.exchangeRate,
      to_currency: 'USDT',
      to_amount: quote.toAmount,
      conversion_fee: quote.conversionFee,
      network_fee: quote.networkFee,
      total_fees: quote.totalFees,
      binance_email: binanceEmail,
      destination_address: destinationAddress,
      destination_network: network,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConversions(userId: string) {
  const { data, error } = await supabase
    .from('binance_conversions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as BinanceConversion[];
}

export async function getConversion(id: string) {
  const { data, error } = await supabase
    .from('binance_conversions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as BinanceConversion;
}
