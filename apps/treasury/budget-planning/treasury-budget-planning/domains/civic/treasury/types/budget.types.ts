export interface BudgetCycle {
  id: string
  fiscal_year: number
  title: string
  description?: string
  total_approved_amount: number
  status: 'draft' | 'submitted' | 'approved' | 'active' | 'closed'
  start_date: string
  end_date: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface BudgetAllocation {
  id: string
  cycle_id: string
  ministry_id: string
  ministry_name: string
  approved_amount: number
  revised_amount?: number
  available_balance: number
  utilization_rate: number
  created_at: string
}

export interface BudgetWarrant {
  id: string
  allocation_id: string
  warrant_number: string
  amount: number
  spent_amount: number
  remaining_amount: number
  status: 'draft' | 'issued' | 'partially_spent' | 'fully_spent' | 'expired' | 'cancelled'
  expiry_date: string
  issued_by: string
  issued_at: string
}

export interface BudgetCommitment {
  id: string
  warrant_id: string
  commitment_number: string
  description: string
  amount: number
  liquidated_amount: number
  remaining_amount: number
  status: 'draft' | 'approved' | 'committed' | 'liquidated' | 'cancelled'
  vendor_id?: string
  vendor_name?: string
  created_at: string
}

export interface BudgetLiquidation {
  id: string
  commitment_id: string
  amount: number
  description: string
  voucher_number: string
  liquidated_at: string
  liquidated_by: string
}

export interface ApprovalHierarchy {
  id: string
  module: string
  approver_id: string
  approver_name: string
  approval_limit: number
  second_approval_required: boolean
  second_approver_id?: string
  is_active: boolean
  created_at: string
}

export interface Delegation {
  id: string
  delegator_id: string
  delegatee_id: string
  module: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}
