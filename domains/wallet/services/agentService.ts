import { supabase } from '@/lib/supabase';
import { Agent, AgentDashboardData, AgentOnboardingForm } from '../types/agent';

const EDGE_URL = 'https://exfmzfrgsxnwwwliatva.supabase.co/functions/v1';

export class AgentService {
  static async onboard(data: AgentOnboardingForm & { userId: string }): Promise<{ success: boolean; agent?: Agent; error?: string }> {
    const res = await fetch(`${EDGE_URL}/agent-onboarding`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return res.ok ? { success: true, agent: json.agent } : { success: false, error: json.error };
  }

  static async activate(userId: string, agentId: string, pin: string): Promise<{ success: boolean; error?: string; float_balance?: number }> {
    const res = await fetch(`${EDGE_URL}/agent-instant-activate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, agentId, pin }),
    });
    const json = await res.json();
    return res.ok ? { success: true, float_balance: json.float_balance } : { success: false, error: json.error };
  }

  static async customerDeposit(agentId: string, customerPhone: string, amount: number, pin: string, customerName?: string) {
    const res = await fetch(`${EDGE_URL}/agent-customer-deposit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, customerPhone, amount, pin, customerName }),
    });
    return res.json();
  }

  static async customerWithdrawal(agentId: string, customerPhone: string, amount: number, pin: string, customerName?: string) {
    const res = await fetch(`${EDGE_URL}/agent-customer-withdrawal`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, customerPhone, amount, pin, customerName }),
    });
    return res.json();
  }

  static async topupFloat(userId: string, agentId: string, amount: number, pin: string) {
    const res = await fetch(`${EDGE_URL}/agent-float-topup`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, agentId, amount, pin }),
    });
    return res.json();
  }

  static async getDashboard(userId: string, agentId: string): Promise<AgentDashboardData> {
    const res = await fetch(`${EDGE_URL}/agent-dashboard`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, agentId }),
    });
    const json = await res.json();
    return json;
  }

  static async getMyAgent(userId: string): Promise<Agent | null> {
    const { data, error } = await supabase.from('agents').select('*').eq('user_id', userId).single();
    return error ? null : data;
  }

  static async verifyAgentQR(qrData: string): Promise<{ verified: boolean; agent?: { id: string; business_name: string; agent_type: string } }> {
    const res = await fetch(`${EDGE_URL}/agent-qr-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData }),
    });
    const json = await res.json();
    return json;
  }
}
