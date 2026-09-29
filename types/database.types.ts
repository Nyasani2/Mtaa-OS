// @ts-nocheck
// Strict TypeScript interfaces matching MTAA OS Database Schema

export interface WalletAccount {
  id: string;
  user_id: string;
  wallet_id: string | null;
  account_type: string; // 'personal' | 'business' | 'savings' | 'escrow' | 'agent'
  currency: string;
  balance: number;
  available_balance: number;
  hold_balance: number;
  status: string; // 'active' | 'frozen' | 'suspended'
  is_default: boolean;
  business_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  type: string; // 'credit' | 'debit' | 'escrow' | 'refund' | 'transfer' | 'deposit' | 'withdrawal'
  amount: number;
  currency: string;
  status: string; // 'pending' | 'completed' | 'failed' | 'cancelled'
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  reference: string | null;
  transaction_type: string | null;
  direction: string | null; // 'incoming' | 'outgoing'
  balance_after: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface BinanceConversion {
  id: string;
  user_id: string;
  wallet_id: string | null;
  from_currency: string;
  from_amount: number;
  exchange_rate: number;
  to_currency: string;
  to_amount: number;
  conversion_fee: number;
  network_fee: number;
  total_fees: number;
  status: string; // 'pending' | 'processing' | 'completed' | 'failed'
  binance_email: string | null;
  binance_user_id: string | null;
  destination_address: string | null;
  destination_network: string | null;
  rate_locked_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  binance_order_id: string | null;
  binance_tx_hash: string | null;
  blockchain_tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: string; // 'funded' | 'released' | 'disputed' | 'refunded'
  description: string;
  goods_description: string | null;
  qr_code_id: string | null;
  created_at: string;
  funded_at: string | null;
  released_at: string | null;
  released_by: string | null;
  dispute_reason: string | null;
  dispute_at: string | null;
  metadata: Record<string, any> | null;
  updated_at: string;
}

export interface WalletAgent {
  id: string;
  user_id: string;
  agent_code: string;
  business_name: string;
  business_type: string;
  commission_rate: number;
  float_balance: number;
  float_limit: number;
  territory: string;
  status: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}
