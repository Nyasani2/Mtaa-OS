export interface TreasuryExpenditure {
  id: string
  voucher_number: string
  description: string
  amount: number
  payee_name: string
  payee_account?: string
  budget_commitment_id?: string
  status: 'pending' | 'approved' | 'processed' | 'paid'
  payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'mobile_money' | 'crypto'
  processed_at?: string
  paid_at?: string
  approved_by?: string
  created_by: string
  created_at: string
}

export interface TsaAccount {
  id: string
  account_number: string
  account_name: string
  bank_name: string
  branch_code?: string
  current_balance: number
  account_type: 'central' | 'sub_account' | 'project'
  ministry_id?: string
  is_active: boolean
  created_at: string
}

export interface TsaTransaction {
  id: string
  account_id: string
  transaction_type: 'receipt' | 'payment' | 'transfer' | 'reversal'
  amount: number
  reference_number: string
  description: string
  related_account_id?: string
  transaction_date: string
  created_by: string
  created_at: string
}

export interface RevenueCollection {
  id: string
  collection_number: string
  source: 'tax' | 'non_tax' | 'fees' | 'fines' | 'grants' | 'loans' | 'dividends' | 'rent'
  sub_source?: string
  amount: number
  collection_date: string
  tsa_account_id?: string
  taxpayer_id?: string
  taxpayer_name?: string
  status: 'pending' | 'confirmed' | 'reconciled' | 'reversed'
  confirmed_at?: string
  created_by: string
  created_at: string
}

export interface BankReconciliation {
  id: string
  tsa_account_id: string
  reconciliation_period: string
  system_balance: number
  bank_balance: number
  difference: number
  status: 'pending' | 'matched' | 'unmatched' | 'resolved'
  ai_anomaly_score?: number
  reconciled_by?: string
  reconciled_at?: string
  created_at: string
}

export interface TreasurySmartContract {
  id: string
  contract_name: string
  contract_address: string
  network: 'ethereum' | 'polygon' | 'binance' | 'solana' | 'hyperledger'
  contract_type: 'payment' | 'escrow' | 'token' | 'governance'
  status: 'draft' | 'deployed' | 'active' | 'paused' | 'terminated'
  deployed_at?: string
  deployed_by?: string
  abi?: Record<string, unknown>
  bytecode?: string
  created_at: string
}
