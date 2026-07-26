import { supabase } from '@/lib/supabase';

export type AgentAction = 
  | 'onboarding' | 'activate' | 'instant_activate' | 'deposit_float'
  | 'float_topup' | 'customer_deposit' | 'customer_withdrawal'
  | 'withdrawal' | 'dashboard' | 'qr_verify' | 'nearby';

export interface AgentOnboardingParams {
  action: 'onboarding';
  userId: string;
  businessName: string;
  location: { lat: number; lng: number; address: string };
  idDocument: string;
  kraPin?: string;
  floatAmount: number;
}

export interface AgentActivateParams {
  action: 'activate' | 'instant_activate';
  agentId: string;
  approvedBy: string;
  floatAmount?: number;
}

export interface AgentDepositFloatParams {
  action: 'deposit_float' | 'float_topup';
  agentId: string;
  amount: number;
  paymentMethod: 'wallet' | 'mpesa' | 'bank';
  reference?: string;
}

export interface AgentCustomerDepositParams {
  action: 'customer_deposit';
  agentId: string;
  customerPhone: string;
  amount: number;
  customerPin: string;
}

export interface AgentCustomerWithdrawalParams {
  action: 'customer_withdrawal';
  agentId: string;
  customerPhone: string;
  amount: number;
  customerPin: string;
}

export interface AgentWithdrawalParams {
  action: 'withdrawal';
  agentId: string;
  amount: number;
  destination: 'wallet' | 'mpesa' | 'bank';
  destinationId: string;
}

export interface AgentDashboardParams {
  action: 'dashboard';
  agentId: string;
  period?: { start: string; end: string };
}

export interface AgentQRVerifyParams {
  action: 'qr_verify';
  agentId: string;
  qrCode: string;
  transactionType: 'deposit' | 'withdrawal' | 'payment';
  amount?: number;
}

export interface AgentNearbyParams {
  action: 'nearby';
  location: { lat: number; lng: number };
  radius?: number;
  maxResults?: number;
}

export type AgentParams = 
  | AgentOnboardingParams | AgentActivateParams | AgentDepositFloatParams
  | AgentCustomerDepositParams | AgentCustomerWithdrawalParams | AgentWithdrawalParams
  | AgentDashboardParams | AgentQRVerifyParams | AgentNearbyParams;

export async function agentOperation(params: AgentParams) {
  const { data, error } = await supabase.functions.invoke('agent-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const agentOnboarding = (p: Omit<AgentOnboardingParams, 'action'>) => 
  agentOperation({ action: 'onboarding', ...p } as AgentOnboardingParams);

export const agentActivate = (p: Omit<AgentActivateParams, 'action'>) => 
  agentOperation({ action: 'activate', ...p } as AgentActivateParams);

export const agentInstantActivate = (p: Omit<AgentActivateParams, 'action'>) => 
  agentOperation({ action: 'instant_activate', ...p } as AgentActivateParams);

export const agentDepositFloat = (p: Omit<AgentDepositFloatParams, 'action'>) => 
  agentOperation({ action: 'deposit_float', ...p } as AgentDepositFloatParams);

export const agentFloatTopup = (p: Omit<AgentDepositFloatParams, 'action'>) => 
  agentOperation({ action: 'float_topup', ...p } as AgentDepositFloatParams);

export const agentCustomerDeposit = (p: Omit<AgentCustomerDepositParams, 'action'>) => 
  agentOperation({ action: 'customer_deposit', ...p } as AgentCustomerDepositParams);

export const agentCustomerWithdrawal = (p: Omit<AgentCustomerWithdrawalParams, 'action'>) => 
  agentOperation({ action: 'customer_withdrawal', ...p } as AgentCustomerWithdrawalParams);

export const agentWithdrawal = (p: Omit<AgentWithdrawalParams, 'action'>) => 
  agentOperation({ action: 'withdrawal', ...p } as AgentWithdrawalParams);

export const agentDashboard = (p: Omit<AgentDashboardParams, 'action'>) => 
  agentOperation({ action: 'dashboard', ...p } as AgentDashboardParams);

export const agentQRVerify = (p: Omit<AgentQRVerifyParams, 'action'>) => 
  agentOperation({ action: 'qr_verify', ...p } as AgentQRVerifyParams);

export const getNearbyAgents = (p: Omit<AgentNearbyParams, 'action'>) => 
  agentOperation({ action: 'nearby', ...p } as AgentNearbyParams);
