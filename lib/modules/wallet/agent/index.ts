
// ============================================================
// MTAA WALLET AGENT / CASHPOINT FRONTEND
// 4 Screens: FindAgentMap, AgentQRScan, AgentDashboard, BecomeAgent
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

// ============================================================
// TYPES
// ============================================================
export interface WalletAgentMap {
  id: string;
  agent_code: string;
  agent_qr_code: string;
  business_name: string;
  business_address: string;
  latitude: number;
  longitude: number;
  rating: number;
  is_open: boolean;
  accepts_deposits: boolean;
  accepts_withdrawals: boolean;
  float_balance: number;
  commission_rate: number;
  area_type: string;
  total_transactions: number;
  distance_km?: number;
}

export interface WalletAgentMapApplication {
  id: string;
  user_id: string;
  full_name: string;
  id_number: string;
  phone: string;
  email?: string;
  business_name?: string;
  business_address: string;
  latitude: number;
  longitude: number;
  area_type: 'urban' | 'semi_urban' | 'rural' | 'remote';
  opens_at: string;
  closes_at: string;
  operating_days: number[];
  accepts_deposits: boolean;
  accepts_withdrawals: boolean;
  accepts_bill_payments: boolean;
  accepts_airtime: boolean;
  collateral_amount: number;
  collateral_paid: boolean;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  daily_deposit_limit: number;
  daily_withdrawal_limit: number;
  max_transaction_amount: number;
}

export interface WalletAgentMapTransaction {
  id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'bill_payment' | 'airtime';
  agent_id: string;
  customer_id: string;
  amount: number;
  agent_commission_amount: number;
  mtaa_commission_amount: number;
  customer_fee_amount: number;
  total_deducted: number;
  total_credited: number;
  status: 'pending' | 'agent_confirmed' | 'completed' | 'failed' | 'cancelled' | 'disputed';
  reference_code: string;
  scanned_qr_code: string;
  customer_phone?: string;
  created_at: string;
}

export interface CommissionBreakdown {
  agent_commission: number;
  mtaa_commission: number;
  customer_fee: number;
  total_deducted: number;
  total_credited: number;
}

// ============================================================
// SERVICE — AGENT MAP & DISCOVERY
// ============================================================
export const agentMapService = {
  async findNearbyAgents(lat: number, lng: number, radiusKm: number = 5, serviceType: 'deposit' | 'withdrawal' = 'deposit'): Promise<WalletAgentMap[]> {
    const { data, error } = await supabase.rpc('find_nearby_agents', {
      lat,
      lng,
      radius_km: radiusKm,
      service_type: serviceType
    });
    if (error) throw error;
    return data || [];
  },

  async getAgentByQR(qrCode: string): Promise<WalletAgentMap | null> {
    const { data, error } = await supabase
      .from('wallet_agents')
      .select('*')
      .eq('agent_qr_code', qrCode)
      .eq('status', 'active')
      .eq('collateral_paid', true)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getAgentById(id: string): Promise<WalletAgentMap | null> {
    const { data, error } = await supabase
      .from('wallet_agents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// ============================================================
// SERVICE — AGENT TRANSACTIONS
// ============================================================
export const agentTransactionService = {
  async calculateCommission(amount: number, type: 'deposit' | 'withdrawal', areaType: string = 'urban'): Promise<CommissionBreakdown> {
    const { data, error } = await supabase.rpc('calculate_agent_commission', {
      p_amount: amount,
      p_transaction_type: type,
      p_area_type: areaType
    });
    if (error) throw error;
    return data[0];
  },

  async initiateTransaction(params: {
    agentId: string;
    customerId: string;
    transactionType: 'deposit' | 'withdrawal';
    amount: number;
    scannedQRCode: string;
    customerPhone?: string;
  }): Promise<WalletAgentMapTransaction> {
    const { data, error } = await supabase
      .from('wallet_agent_transactions')
      .insert({
        agent_id: params.agentId,
        customer_id: params.customerId,
        transaction_type: params.transactionType,
        amount: params.amount,
        scanned_qr_code: params.scannedQRCode,
        customer_phone: params.customerPhone,
        status: 'pending',
        reference_code: `AGT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Failed to create transaction');
    return data;
  },

  async agentConfirmTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('wallet_agent_transactions')
      .update({ status: 'agent_confirmed' })
      .eq('id', transactionId);
    if (error) throw error;
  },

  async completeTransaction(transactionId: string): Promise<CommissionBreakdown> {
    const { data, error } = await supabase.rpc('process_agent_transaction', {
      p_transaction_id: transactionId
    });
    if (error) throw error;
    return data;
  },

  async getCustomerTransactions(): Promise<WalletAgentMapTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_agent_transactions')
      .select('*, wallet_agents(business_name, agent_code)')
      .eq('customer_id', useAuthStore.getState().user?.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAgentTransactions(agentId: string): Promise<WalletAgentMapTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_agent_transactions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};

// ============================================================
// SERVICE — BECOME AN AGENT
// ============================================================
export const agentApplicationService = {
  async submitApplication(application: Omit<WalletAgentMapApplication, 'id' | 'created_at' | 'updated_at' | 'status' | 'collateral_paid'>): Promise<WalletAgentMapApplication> {
    const { data, error } = await supabase
      .from('wallet_agent_applications')
      .insert({
        ...application,
        status: 'pending',
        collateral_paid: false
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Failed to submit application');
    return data;
  },

  async payCollateral(applicationId: string, amount: number = 50000): Promise<void> {
    // This calls the wallet service to transfer 50,000 as collateral
    // Then updates the application
    const { error } = await supabase.functions.invoke('agent-pay-collateral', {
      body: { application_id: applicationId, amount }
    });
    if (error) throw error;
  },

  async getMyApplication(): Promise<WalletAgentMapApplication | null> {
    const { data, error } = await supabase
      .from('wallet_agent_applications')
      .select('*')
      .eq('user_id', useAuthStore.getState().user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getMyAgentProfile(): Promise<WalletAgentMap | null> {
    const { data, error } = await supabase
      .from('wallet_agents')
      .select('*')
      .eq('user_id', useAuthStore.getState().user?.id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// ============================================================
// HOOKS
// ============================================================
export function useNearbyAgents(lat: number, lng: number, radiusKm: number = 5, serviceType: 'deposit' | 'withdrawal' = 'deposit') {
  return useQuery({
    queryKey: ['nearby-agents', lat, lng, radiusKm, serviceType],
    queryFn: () => agentMapService.findNearbyAgents(lat, lng, radiusKm, serviceType),
    enabled: !!lat && !!lng,
  });
}

export function useAgentByQR(qrCode: string) {
  return useQuery({
    queryKey: ['agent-qr', qrCode],
    queryFn: () => agentMapService.getAgentByQR(qrCode),
    enabled: !!qrCode,
  });
}

export function useAgentById(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentMapService.getAgentById(agentId),
    enabled: !!agentId,
  });
}

export function useCalculateCommission() {
  return useMutation({
    mutationFn: ({ amount, type, areaType }: { amount: number; type: 'deposit' | 'withdrawal'; areaType: string }) =>
      agentTransactionService.calculateCommission(amount, type, areaType),
  });
}

export function useInitiateAgentTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentTransactionService.initiateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions'] });
    },
  });
}

export function useCompleteAgentTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentTransactionService.completeTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['agent-earnings'] });
    },
  });
}

export function useCustomerAgentTransactions() {
  return useQuery({
    queryKey: ['customer-agent-transactions'],
    queryFn: agentTransactionService.getCustomerTransactions,
  });
}

export function useAgentTransactions(agentId: string) {
  return useQuery({
    queryKey: ['agent-transactions', agentId],
    queryFn: () => agentTransactionService.getAgentTransactions(agentId),
    enabled: !!agentId,
  });
}

export function useSubmitAgentApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentApplicationService.submitApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-agent-application'] });
    },
  });
}

export function useMyAgentApplication() {
  return useQuery({
    queryKey: ['my-agent-application'],
    queryFn: agentApplicationService.getMyApplication,
  });
}

export function useMyAgentProfile() {
  return useQuery({
    queryKey: ['my-agent-profile'],
    queryFn: agentApplicationService.getMyAgentProfile,
  });
}

// ============================================================
// SCREEN 1: FIND AGENT MAP (Customer View)
// ============================================================
export function FindAgentMapScreen() {
  const [serviceType, setServiceType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<WalletAgentMap | null>(null);
  const { data: agents, isLoading } = useNearbyAgents(
    location?.lat || -1.2921,
    location?.lng || 36.8219,
    10,
    serviceType
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const handleAgentSelect = (agent: WalletAgentMap) => {
    setSelectedAgent(agent);
    // Navigate to QR scan screen with agent pre-selected
    // router.push(`/wallet/agent-scan?agentId=${agent.id}` as any);
  };

  return {
    serviceType,
    setServiceType,
    location,
    agents,
    isLoading,
    selectedAgent,
    handleAgentSelect,
  };
}

// ============================================================
// SCREEN 2: AGENT QR SCAN (Customer scans agent QR)
// ============================================================
export function AgentQRScanScreen() {
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scannedAgent, setScannedAgent] = useState<WalletAgentMap | null>(null);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [commission, setCommission] = useState<CommissionBreakdown | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateCommission = useCalculateCommission();
  const initiateTransaction = useInitiateAgentTransaction();
  const completeTransaction = useCompleteAgentTransaction();

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    // data is the agent_qr_code
    const { data: agent } = await supabase
      .from('wallet_agents')
      .select('*')
      .eq('agent_qr_code', data)
      .eq('status', 'active')
      .maybeSingle();

    if (agent) {
      setScannedAgent(agent);
    } else {
      Alert.alert('Invalid QR', 'This agent QR code is not valid or the agent is inactive.');
    }
  }, []);

  const handleCalculateCommission = async () => {
    if (!scannedAgent || !amount) return;
    const result = await calculateCommission.mutateAsync({
      amount: parseFloat(amount),
      type: transactionType,
      areaType: scannedAgent.area_type
    });
    setCommission(result);
  };

  const handleConfirm = async () => {
    if (!scannedAgent || !amount || !commission) return;
    setIsProcessing(true);

    try {
      // Step 1: Create transaction record
      const tx = await initiateTransaction.mutateAsync({
        agentId: scannedAgent.id,
        customerId: useAuthStore.getState().user?.id || '',
        transactionType,
        amount: parseFloat(amount),
        scannedQRCode: scannedAgent.agent_qr_code,
      });

      // Step 2: WalletAgentMap confirms (in real app, agent taps confirm on their device)
      await agentTransactionService.agentConfirmTransaction(tx.id);

      // Step 3: Process the transaction (wallet transfers + commissions)
      const result = await completeTransaction.mutateAsync(tx.id);

      Alert.alert(
        'Success',
        `${transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} of KES ${amount} completed.
` +
        `WalletAgentMap commission: KES ${result.agent_commission}
` +
        `Fee: KES ${result.customer_fee}`
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    hasPermission,
    requestPermission,
    scannedAgent,
    transactionType,
    setTransactionType,
    amount,
    setAmount,
    commission,
    isProcessing,
    handleBarCodeScanned,
    handleCalculateCommission,
    handleConfirm,
  };
}

// ============================================================
// SCREEN 3: AGENT DASHBOARD (WalletAgentMap's own view)
// ============================================================
export function AgentDashboardScreen() {
  const { data: agentProfile, isLoading: profileLoading } = useMyAgentProfile();
  const { data: transactions, isLoading: txLoading } = useAgentTransactions(agentProfile?.id || '');
  const { data: dailyLimits } = useQuery({
    queryKey: ['agent-daily-limits', agentProfile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('wallet_agent_daily_limits')
        .select('*')
        .eq('agent_id', agentProfile?.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle();
      return data;
    },
    enabled: !!agentProfile?.id,
  });

  const generateQRCode = async () => {
    if (!agentProfile) return;
    // Generate or refresh QR code
    const qrData = `MTAA-AGENT-${agentProfile.agent_code}`;
    // In real app, render QR code from qrData
    return qrData;
  };

  return {
    agentProfile,
    transactions,
    dailyLimits,
    profileLoading,
    txLoading,
    generateQRCode,
  };
}

// ============================================================
// SCREEN 4: BECOME AN AGENT (Application flow)
// ============================================================
export function BecomeAgentScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<WalletAgentMapApplication>>({
    full_name: '',
    id_number: '',
    phone: '',
    email: '',
    business_name: '',
    business_address: '',
    latitude: 0,
    longitude: 0,
    area_type: 'urban',
    opens_at: '08:00:00',
    closes_at: '18:00:00',
    operating_days: [1, 2, 3, 4, 5, 6],
    accepts_deposits: true,
    accepts_withdrawals: true,
    accepts_bill_payments: false,
    accepts_airtime: false,
    collateral_amount: 50000,
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const submitApplication = useSubmitAgentApplication();
  const { data: existingApplication } = useMyAgentApplication();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setFormData(prev => ({
          ...prev,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        }));
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.id_number || !formData.phone || !formData.business_address) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await submitApplication.mutateAsync(formData as Omit<WalletAgentMapApplication, 'id' | 'created_at' | 'updated_at' | 'status' | 'collateral_paid'>);
      setStep(3); // Go to payment step
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit');
    }
  };

  const handlePayCollateral = async () => {
    if (!existingApplication) return;
    try {
      await agentApplicationService.payCollateral(existingApplication.id, 50000);
      Alert.alert('Success', 'Collateral paid. Your application is under review.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Payment failed');
    }
  };

  return {
    step,
    setStep,
    formData,
    setFormData,
    location,
    existingApplication,
    submitApplication,
    handleSubmit,
    handlePayCollateral,
  };
}

// ============================================================
// EXPORTS
// ============================================================
