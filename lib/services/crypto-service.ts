import { supabase } from '@/lib/supabase';

export interface CryptoWallet {
  id: string;
  user_id: string;
  currency: string;
  address: string;
  balance: number;
  network: string;
  created_at: string;
}

export class CryptoService {
  async getWallets(userId: string): Promise<CryptoWallet[]> {
    try {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('getWallets error:', error);
      return [];
    }
  }

  async createWallet(userId: string, currency: string, network: string): Promise<CryptoWallet | null> {
    try {
      const mockAddress = this.generateMockAddress(currency);
      
      const { data, error } = await supabase
        .from('crypto_wallets')
        .insert({
          user_id: userId,
          currency,
          network,
          address: mockAddress,
          balance: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('createWallet error:', error);
      throw new Error(error?.message || 'Failed to create wallet');
    }
  }

  async initiateTransfer(walletId: string, toAddress: string, amount: number): Promise<any> {
    try {
      const { data: wallet } = await supabase
        .from('crypto_wallets')
        .select('balance, currency')
        .eq('id', walletId)
        .single();

      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      const { data: tx, error: txError } = await supabase
        .from('crypto_transactions')
        .insert({
          wallet_id: walletId,
          type: 'withdrawal',
          amount,
          currency: wallet.currency,
          address: toAddress,
          status: 'confirmed',
          tx_hash: '0x' + Math.random().toString(36).substr(2, 64),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (txError) throw txError;

      await supabase
        .from('crypto_wallets')
        .update({ balance: wallet.balance - amount })
        .eq('id', walletId);

      return tx;
    } catch (error: any) {
      console.error('initiateTransfer error:', error);
      throw new Error(error?.message || 'Transfer failed');
    }
  }

  async convertCrypto(fromWalletId: string, toCurrency: string, amount: number): Promise<any> {
    try {
      const rates: Record<string, number> = {
        'BTC': 1,
        'ETH': 15.5,
        'USDT': 45000,
        'BNB': 120,
      };

      const fromWallet = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('id', fromWalletId)
        .single();

      if (!fromWallet.data) throw new Error('Wallet not found');

      const fromRate = rates[fromWallet.data.currency] || 1;
      const toRate = rates[toCurrency] || 1;
      const convertedAmount = (amount * fromRate) / toRate;

      let { data: toWallet } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', fromWallet.data.user_id)
        .eq('currency', toCurrency)
        .single();

      if (!toWallet) {
        const newWallet = await this.createWallet(fromWallet.data.user_id, toCurrency, 'mainnet');
        toWallet = newWallet;
      }

      const { data: tx, error } = await supabase
        .from('crypto_transactions')
        .insert({
          wallet_id: fromWalletId,
          type: 'conversion',
          amount,
          currency: fromWallet.data.currency,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('crypto_wallets')
        .update({ balance: fromWallet.data.balance - amount })
        .eq('id', fromWalletId);

      if (toWallet) {
        await supabase
          .from('crypto_wallets')
          .update({ balance: (toWallet.balance || 0) + convertedAmount })
          .eq('id', toWallet.id);
      }

      return tx;
    } catch (error: any) {
      console.error('convertCrypto error:', error);
      throw new Error(error?.message || 'Conversion failed');
    }
  }

  private generateMockAddress(currency: string): string {
    const prefixes: Record<string, string> = {
      'BTC': '1',
      'ETH': '0x',
      'USDT': '0x',
      'BNB': 'bnb1',
    };
    const prefix = prefixes[currency] || '0x';
    return prefix + Math.random().toString(36).substr(2, 40);
  }
}

export const cryptoService = new CryptoService();
