
import { supabase } from '@/lib/supabase';
import { BinanceUserLink } from '../types/binance.types';

export async function getBinanceLink(userId: string) {
  const { data, error } = await supabase
    .from('binance_user_links')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as BinanceUserLink | null;
}

export async function linkBinanceAccount(userId: string, email: string, apiKey?: string, apiSecret?: string) {
  const { data, error } = await supabase
    .from('binance_user_links')
    .upsert({
      user_id: userId,
      binance_email: email,
      binance_api_key_encrypted: apiKey,
      binance_api_secret_encrypted: apiSecret,
      is_verified: false,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBinancePreferences(
  userId: string,
  prefs: { default_network?: string; auto_convert?: boolean; auto_convert_threshold?: number }
) {
  const { data, error } = await supabase
    .from('binance_user_links')
    .update(prefs)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
