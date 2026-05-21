
export interface BinanceConversion {
  id: string;
  user_id: string;
  from_currency: string;
  from_amount: number;
  exchange_rate: number;
  to_currency: string;
  to_amount: number;
  conversion_fee: number;
  network_fee: number;
  total_fees: number;
  binance_email?: string;
  destination_address?: string;
  destination_network: 'TRC20' | 'ERC20' | 'BEP20' | 'SOL';
  status: 'pending' | 'rate_locked' | 'processing' | 'completed' | 'failed' | 'cancelled';
  rate_locked_at?: string;
  processed_at?: string;
  completed_at?: string;
  binance_order_id?: string;
  blockchain_tx_hash?: string;
  created_at: string;
}

export interface BinanceUserLink {
  id: string;
  user_id: string;
  binance_email?: string;
  is_verified: boolean;
  default_network: string;
  auto_convert: boolean;
  auto_convert_threshold: number;
  is_active: boolean;
  last_used_at?: string;
}

export interface BinanceRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string;
  recorded_at: string;
}

export interface BinanceLimit {
  id: string;
  user_id: string;
  daily_converted_kes: number;
  daily_limit_kes: number;
  monthly_converted_kes: number;
  monthly_limit_kes: number;
}

export interface ConversionQuote {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  conversionFee: number;
  networkFee: number;
  totalFees: number;
  netAmount: number;
}
