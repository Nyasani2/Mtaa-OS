export interface DebtInstrument {
  id: string
  instrument_type: 'bilateral' | 'multilateral' | 'commercial' | 't_bills' | 't_bonds' | 'sukuk' | 'guarantees'
  creditor_name: string
  original_principal: number
  outstanding_principal: number
  interest_rate: number
  interest_type: 'fixed' | 'floating'
  issue_date: string
  maturity_date: string
  currency: string
  total_interest_paid: number
  next_payment_date?: string
  next_payment_amount?: number
  status: 'active' | 'repaid' | 'defaulted' | 'restructured' | 'cancelled'
  created_by: string
  created_at: string
}

export interface DebtPayment {
  id: string
  instrument_id: string
  payment_number: number
  principal_amount: number
  interest_amount: number
  total_amount: number
  payment_date: string
  status: 'scheduled' | 'paid' | 'overdue' | 'waived'
  paid_at?: string
  created_at: string
}

export interface PayrollCycle {
  id: string
  cycle_name: string
  period_start: string
  period_end: string
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'reversed'
  total_gross_pay: number
  total_deductions: number
  total_net_pay: number
  employee_count: number
  paid_at?: string
  approved_by?: string
  created_by: string
  created_at: string
}

export interface PayrollEntry {
  id: string
  cycle_id: string
  employee_id: string
  employee_name: string
  basic_salary: number
  allowances: number
  overtime: number
  gross_pay: number
  tax_deduction: number
  pension_deduction: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  biometric_verified: boolean
  biometric_verified_at?: string
  status: 'draft' | 'approved' | 'paid' | 'reversed'
  created_at: string
}

export interface CashForecast {
  id: string
  forecast_period: string
  opening_balance: number
  projected_receipts: number
  projected_payments: number
  projected_closing_balance: number
  actual_closing_balance?: number
  variance?: number
  variance_percentage?: number
  model_used: string
  confidence_interval_lower?: number
  confidence_interval_upper?: number
  created_by: string
  created_at: string
}

export interface RevenueForecast {
  id: string
  forecast_period: string
  projected_revenue: number
  actual_revenue?: number
  variance?: number
  model_used: string
  confidence_interval_lower?: number
  confidence_interval_upper?: number
  created_by: string
  created_at: string
}
