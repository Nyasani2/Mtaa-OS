export interface TreasuryDashboard {
  total_budget: number
  total_expenditure: number
  total_revenue: number
  cash_balance: number
  pending_approvals: number
  alerts: TreasuryAlert[]
  recent_transactions: TreasuryTransaction[]
}

export interface TreasuryAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  module: string
  created_at: string
}

export interface TreasuryTransaction {
  id: string
  type: 'expenditure' | 'revenue' | 'transfer' | 'debt'
  amount: number
  description: string
  status: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  created_at: string
}

export interface FeedbackTicket {
  id: string
  user_id: string
  module: string
  category: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  resolved_at?: string
}
