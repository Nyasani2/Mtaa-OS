export interface Agent {
  id: string;
  agent_type: 'kiosk' | 'mobile' | 'stationary';
  business_name: string;
  id_number: string;
  kra_pin: string;
  business_address?: string;
  location_lat?: number;
  location_lng?: number;
  status: 'pending_approval' | 'approved' | 'active' | 'suspended' | 'revoked';
  qr_code_data: string;
  float_balance: number;
  total_commission_earned: number;
  daily_transaction_limit: number;
  monthly_transaction_limit: number;
  today_deposited: number;
  today_withdrawn: number;
  monthly_volume: number;
  created_at: string;
}

export interface AgentTransaction {
  id: string;
  agent_id: string;
  customer_id?: string;
  type: 'customer_deposit' | 'customer_withdrawal' | 'float_topup' | 'commission_payout';
  amount: number;
  commission: number;
  customer_phone?: string;
  customer_name?: string;
  confirmation_message: string;
  status: string;
  reference_code: string;
  created_at: string;
}

export interface AgentDashboardData {
  agent: Agent;
  today_stats: {
    deposits: number;
    withdrawals: number;
    commission: number;
    transaction_count: number;
  };
  recent_transactions: AgentTransaction[];
  float_history: {
    id: string;
    change_type: string;
    amount: number;

    description: string;
    created_at: string;
  }[];
}

export interface AgentOnboardingForm {
  agentType: 'kiosk' | 'mobile' | 'stationary';
  businessName: string;
  idNumber: string;
  kraPin: string;
  businessAddress: string;
  locationLat?: number;
  locationLng?: number;
  pin: string;
}
