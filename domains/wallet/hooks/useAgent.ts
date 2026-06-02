import { useState, useEffect, useCallback } from 'react';
import { AgentService } from '../services/agentService';
import { Agent, AgentDashboardData, AgentOnboardingForm } from '../types/agent';
import { useAuth } from '@/hooks/useAuth';

export function useAgent() {
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [dashboard, setDashboard] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await AgentService.getMyAgent(user.id);
    setAgent(data);
    setLoading(false);
  }, [user?.id]);

  const fetchDashboard = useCallback(async () => {
    if (!user?.id || !agent?.id) return;
    setLoading(true);
    try {
      const data = await AgentService.getDashboard(user.id, agent.id);
      setDashboard(data);
    } catch (e) {
      setError('Failed to load dashboard');
    }
    setLoading(false);
  }, [user?.id, agent?.id]);

  const onboard = async (form: AgentOnboardingForm) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    const result = await AgentService.onboard({ ...form, userId: user.id });
    setLoading(false);
    if (result.success) fetchAgent();
    return result;
  };

  const activate = async (pin: string) => {
    if (!user?.id || !agent?.id) return { success: false, error: 'Missing data' };
    setLoading(true);
    const result = await AgentService.activate(user.id, agent.id, pin);
    setLoading(false);
    if (result.success) fetchAgent();
    return result;
  };

  const deposit = async (customerPhone: string, amount: number, pin: string, customerName?: string) => {
    if (!agent?.id) return { success: false, error: 'Not an agent' };
    setLoading(true);
    const result = await AgentService.customerDeposit(agent.id, customerPhone, amount, pin, customerName);
    setLoading(false);
    fetchDashboard();
    return result;
  };

  const withdraw = async (customerPhone: string, amount: number, pin: string, customerName?: string) => {
    if (!agent?.id) return { success: false, error: 'Not an agent' };
    setLoading(true);
    const result = await AgentService.customerWithdrawal(agent.id, customerPhone, amount, pin, customerName);
    setLoading(false);
    fetchDashboard();
    return result;
  };

  const topup = async (amount: number, pin: string) => {
    if (!user?.id || !agent?.id) return { success: false, error: 'Missing data' };
    setLoading(true);
    const result = await AgentService.topupFloat(user.id, agent.id, amount, pin);
    setLoading(false);
    fetchAgent();
    return result;
  };

  useEffect(() => { fetchAgent(); }, [fetchAgent]);
  useEffect(() => { if (agent?.status === 'active') fetchDashboard(); }, [agent?.status, fetchDashboard]);

  return {
    agent, dashboard, loading, error,
    onboard, activate, deposit, withdraw, topup,
    refresh: fetchAgent, refreshDashboard: fetchDashboard,
  };
}
