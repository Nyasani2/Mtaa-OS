// ============================================================================
// MTAA Creator Earnings Types
// ============================================================================

export interface CreatorEarning {
  id: string;
  profile_id: string;
  user_id: string;
  source_type: string;
  source_id: string | null;
  source_module: string;
  gross_amount: number;
  platform_fee: number;
  tax_withheld: number;
  processing_fee: number;
  net_amount: number;
  currency: string;
  treasury_account_id: string | null;
  treasury_voucher_id: string | null;
  routed_to_treasury: boolean;
  routed_at: string | null;
  status: 'pending' | 'available' | 'withdrawn' | 'held' | 'disputed' | 'refunded';
  available_at: string | null;
  withdrawn_at: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatorEarningSummary {
  totalGross: number;
  totalNet: number;
  availableBalance: number;
  totalWithdrawn: number;
  pendingCount: number;
  availableCount: number;
  withdrawnCount: number;
  lastEarningAt: string | null;
  earningsByModule: Record<string, number>;
}

export interface CreatorWithdrawal {
  id: string;
  profile_id: string;
  user_id: string;
  amount: number;
  currency: string;
  fee: number;
  net_amount: number;
  destination_type: 'wallet' | 'bank' | 'mobile_money' | 'crypto';
  destination_details: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processed_at: string | null;
  processed_by: string | null;
  failure_reason: string | null;
  treasury_expenditure_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EarningsBySource {
  sourceModule: string;
  sourceType: string;
  totalGross: number;
  totalNet: number;
  count: number;
}

export interface MonthlyEarnings {
  month: string;
  gross: number;
  net: number;
  fees: number;
  tax: number;
}
