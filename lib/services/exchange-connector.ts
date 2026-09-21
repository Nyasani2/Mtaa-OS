// @ts-nocheck
import CryptoJS from 'crypto-js';
import { supabase } from '@/lib/supabase';

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_API_ENCRYPTION_KEY || 'default-dev-key-change-in-prod';

function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}
function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export class ExchangeConnector {
  async saveBinanceCredentials(userId: string, apiKey: string, apiSecret: string) {
    await supabase.from('user_exchange_accounts').upsert({
      user_id: userId,
      exchange: 'binance',
      api_key_encrypted: encrypt(apiKey),
      api_secret_encrypted: encrypt(apiSecret),
      permissions: 'read,spot_trade',
      is_active: true
    });
  }

  async getBinanceBalance(userId: string): Promise<any> {
    const { data } = await supabase.from('user_exchange_accounts')
      .select('api_key_encrypted, api_secret_encrypted')
      .eq('user_id', userId).eq('exchange', 'binance').single();
    
    if (!data) throw new Error('Binance account not connected');

    const apiKey = decrypt(data.api_key_encrypted);
    const apiSecret = decrypt(data.api_secret_encrypted);

    // In production, call Binance REST API here using the decrypted keys
    return {
      totalBalanceUSD: 1250.50,
      assets: [{ asset: 'USDT', free: 1000.00, locked: 250.50 }]
    };
  }

  async saveDerivToken(userId: string, token: string) {
    await supabase.from('user_exchange_accounts').upsert({
      user_id: userId,
      exchange: 'deriv',
      api_key_encrypted: encrypt(token),
      is_active: true
    });
  }
}
export const exchangeConnector = new ExchangeConnector();
