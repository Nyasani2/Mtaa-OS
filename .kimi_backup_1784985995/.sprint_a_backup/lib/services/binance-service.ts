import { supabase } from '@/lib/supabase';

export interface CryptoPrice {
  symbol: string;
  price: number;
  change_24h: number;
  change_percent_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  last_updated: string;
}

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price: number;
  total_value: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled';
  created_at: string;
}

export async function getPrices(symbols: string[]) {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'get_prices', symbols }
  });
  if (error) throw error;
  return data;
}

export async function getTicker(symbol: string) {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'get_ticker', symbol }
  });
  if (error) throw error;
  return data;
}

export async function getKlines(symbol: string, interval: string, limit = 100) {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'get_klines', symbol, interval, limit }
  });
  if (error) throw error;
  return data;
}

export async function placeTrade(params: Omit<Trade, 'id' | 'total_value' | 'status' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'place_trade', ...params }
  });
  if (error) throw error;
  return data;
}

export async function getMyTrades(user_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'get_my_trades', user_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function cancelTrade(trade_id: string, user_id: string) {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'cancel_trade', trade_id, user_id }
  });
  if (error) throw error;
  return data;
}

export async function getPortfolio(user_id: string) {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'get_portfolio', user_id }
  });
  if (error) throw error;
  return data;
}

export async function health() {
  const { data, error } = await supabase.functions.invoke('binance-operations', {
    body: { action: 'health' }
  });
  if (error) throw error;
  return data;
}
