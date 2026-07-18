
// ============================================================
// ⚠️  KNOWN ISSUE — this is NOT a simple renaming fix. Business M-Pesa
// collection (paybill/till payments) is not actually implemented
// end-to-end anywhere in this codebase. Verified 2026-07-17:
//
// 1. This module calls 'daraja-stk-push', 'daraja-stk-query',
//    'daraja-callback-handler', 'daraja-refresh-token' — none exist.
// 2. The closest real match is supabase/functions/mpesa-operations
//    (action: 'stk_push_business'), BUT that handler's own comment
//    admits it doesn't call the real Safaricom Daraja API — it inserts
//    a fake "pending" record and returns success without ever placing
//    a real STK push. No actual Daraja OAuth/signing implementation
//    (using the consumer_key/secret/passkey this module's DarajaConfig
//    type stores) exists anywhere in the repo.
// 3. It also writes to a different table (mpesa_transactions) than
//    this frontend module reads from (daraja_transactions) — need to
//    confirm both exist and decide which is authoritative.
//
// The database layer here (business_owners, daraja_configs,
// daraja_transactions tables) IS verified to exist and match this
// module's types. What's missing is real backend work: an actual
// Safaricom Daraja API integration (OAuth token exchange + signed STK
// push + callback verification), not a wiring fix. Do not rename the
// function calls below to point at mpesa-operations without first
// building that real integration — doing so would make this feature
// look functional while still not actually charging anyone.
// ============================================================

// ============================================================
// MTAA M-PESA / DARAJA FRONTEND (v3)
// Added: business_owners types, service, hooks
// Model: user ↔ business_owners ↔ businesses ↔ daraja_configs
// ============================================================

// ============================================================
// TYPES
// ============================================================
export interface BusinessOwner {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'viewer';
  can_manage_payments: boolean;
  can_view_transactions: boolean;
  can_refund: boolean;
  can_configure: boolean;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface DarajaConfig {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  environment: 'sandbox' | 'production';
  is_active: boolean;
  is_default: boolean;
  consumer_key: string;
  consumer_secret: string;
  passkey: string;
  shortcode: string;
  store_number: string | null;
  till_number: string | null;
  stk_callback_url: string | null;
  c2b_validation_url: string | null;
  c2b_confirmation_url: string | null;
  b2c_result_url: string | null;
  b2c_timeout_url: string | null;
  b2c_initiator_name: string | null;
  b2c_security_credential: string | null;
  b2c_shortcode: string | null;
  daily_transaction_limit: number;
  daily_amount_limit: number;
  min_transaction_amount: number;
  max_transaction_amount: number;
  access_token: string | null;
  token_expires_at: string | null;
  metadata: Record<string, any>;
  created_by: string | null;
  updated_by: string | null;
}

export interface DarajaTransaction {
  id: string;
  created_at: string;
  updated_at: string;
  transaction_type: 'stk_push' | 'stk_push_query' | 'c2b' | 'b2c' | 'reversal' | 'balance_query' | 'transaction_status';
  config_id: string;
  business_id: string | null;
  wallet_transaction_id: string | null;
  mpesa_transaction_id: string | null;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  mpesa_receipt_number: string | null;
  conversation_id: string | null;
  originator_conversation_id: string | null;
  party_a: string;
  party_b: string;
  phone_number: string | null;
  amount: number;
  transaction_cost: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'timeout' | 'reversed';
  result_code: string | null;
  result_desc: string | null;
  stk_callback_received: boolean;
  stk_callback_received_at: string | null;
  stk_callback_payload: Record<string, any> | null;
  bill_ref_number: string | null;
  invoice_number: string | null;
  account_reference: string | null;
  occasion: string | null;
  command_id: string | null;
  original_transaction_id: string | null;
  reversal_reason: string | null;
  request_payload: Record<string, any>;
  response_payload: Record<string, any> | null;
  raw_callback: Record<string, any> | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  metadata: Record<string, any>;
  created_by: string | null;
  updated_by: string | null;
}

export interface STKPushRequest {
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  callback_url?: string;
}

export interface STKPushResponse {
  merchant_request_id: string;
  checkout_request_id: string;
  response_code: string;
  response_description: string;
  customer_message: string;
}

// ============================================================
// SERVICE — BUSINESS OWNERS
// ============================================================
import { supabase } from '@/lib/supabase/client';

export const businessOwnerService = {
  async getMyBusinesses(): Promise<BusinessOwner[]> {
    const { data, error } = await supabase
      .from('business_owners')
      .select('*, businesses(*)')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  async getBusinessOwners(businessId: string): Promise<BusinessOwner[]> {
    const { data, error } = await supabase
      .from('business_owners')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  async addBusinessOwner(owner: Omit<BusinessOwner, 'id' | 'created_at' | 'updated_at'>): Promise<BusinessOwner> {
    const { data, error } = await supabase
      .from('business_owners')
      .insert(owner)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to add business owner');
    return data;
  },

  async updateBusinessOwner(id: string, updates: Partial<BusinessOwner>): Promise<BusinessOwner> {
    const { data, error } = await supabase
      .from('business_owners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update business owner');
    return data;
  },

  async removeBusinessOwner(id: string): Promise<void> {
    const { error } = await supabase
      .from('business_owners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================================
// SERVICE — DARAJA CONFIG
// ============================================================
export const darajaConfigService = {
  async getConfigs(businessId?: string): Promise<DarajaConfig[]> {
    let query = supabase
      .from('daraja_configs')
      .select('*')
      .eq('is_active', true);

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query.order('is_default', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getDefaultConfig(businessId: string): Promise<DarajaConfig | null> {
    const { data, error } = await supabase
      .from('daraja_configs')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getConfigById(id: string): Promise<DarajaConfig | null> {
    const { data, error } = await supabase
      .from('daraja_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createConfig(config: Omit<DarajaConfig, 'id' | 'created_at' | 'updated_at'>): Promise<DarajaConfig> {
    const { data, error } = await supabase
      .from('daraja_configs')
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create Daraja config');
    return data;
  },

  async updateConfig(id: string, updates: Partial<DarajaConfig>): Promise<DarajaConfig> {
    const { data, error } = await supabase
      .from('daraja_configs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update Daraja config');
    return data;
  },

  async deleteConfig(id: string): Promise<void> {
    const { error } = await supabase
      .from('daraja_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setDefaultConfig(id: string, businessId: string): Promise<void> {
    const { error } = await supabase
      .from('daraja_configs')
      .update({ is_default: true })
      .eq('id', id)
      .eq('business_id', businessId);

    if (error) throw error;
  },

  async refreshAccessToken(configId: string): Promise<{ access_token: string; expires_at: string }> {
    const { data, error } = await supabase.functions.invoke('daraja-refresh-token', {
      body: { config_id: configId }
    });

    if (error) throw error;
    return data;
  }
};

// ============================================================
// SERVICE — DARAJA TRANSACTIONS
// ============================================================
export const darajaTransactionService = {
  async getTransactions(filters?: {
    businessId?: string;
    status?: string;
    transactionType?: string;
    phoneNumber?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: DarajaTransaction[]; count: number }> {
    let query = supabase
      .from('daraja_transactions')
      .select('*', { count: 'exact' });

    if (filters?.businessId) query = query.eq('business_id', filters.businessId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.transactionType) query = query.eq('transaction_type', filters.transactionType);
    if (filters?.phoneNumber) query = query.ilike('phone_number', `%${filters.phoneNumber}%`);
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo);

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async getTransactionById(id: string): Promise<DarajaTransaction | null> {
    const { data, error } = await supabase
      .from('daraja_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getTransactionByCheckoutId(checkoutRequestId: string): Promise<DarajaTransaction | null> {
    const { data, error } = await supabase
      .from('daraja_transactions')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async initiateSTKPush(request: STKPushRequest & { configId: string; businessId: string }): Promise<STKPushResponse> {
    const { data, error } = await supabase.functions.invoke('daraja-stk-push', {
      body: request
    });

    if (error) throw error;
    return data;
  },

  async querySTKStatus(checkoutRequestId: string, configId: string): Promise<DarajaTransaction> {
    const { data, error } = await supabase.functions.invoke('daraja-stk-query', {
      body: { checkout_request_id: checkoutRequestId, config_id: configId }
    });

    if (error) throw error;
    return data;
  },

  async processCallback(payload: Record<string, any>): Promise<void> {
    const { error } = await supabase.functions.invoke('daraja-callback-handler', {
      body: payload
    });

    if (error) throw error;
  },

  async getDailySummary(businessId: string, date?: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('v_daraja_daily_summary')
      .select('*')
      .eq('business_id', businessId)
      .eq('day', date || new Date().toISOString().split('T')[0]);

    if (error) throw error;
    return data || [];
  }
};

// ============================================================
// HOOKS
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMyBusinesses() {
  return useQuery({
    queryKey: ['my-businesses'],
    queryFn: () => businessOwnerService.getMyBusinesses(),
  });
}

export function useBusinessOwners(businessId: string) {
  return useQuery({
    queryKey: ['business-owners', businessId],
    queryFn: () => businessOwnerService.getBusinessOwners(businessId),
    enabled: !!businessId,
  });
}

export function useAddBusinessOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessOwnerService.addBusinessOwner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-owners'] });
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
    },
  });
}

export function useUpdateBusinessOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BusinessOwner> }) =>
      businessOwnerService.updateBusinessOwner(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-owners'] });
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
    },
  });
}

export function useRemoveBusinessOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessOwnerService.removeBusinessOwner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-owners'] });
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
    },
  });
}

export function useDarajaConfigs(businessId?: string) {
  return useQuery({
    queryKey: ['daraja-configs', businessId],
    queryFn: () => darajaConfigService.getConfigs(businessId),
    enabled: !!businessId,
  });
}

export function useDarajaDefaultConfig(businessId: string) {
  return useQuery({
    queryKey: ['daraja-config-default', businessId],
    queryFn: () => darajaConfigService.getDefaultConfig(businessId),
    enabled: !!businessId,
  });
}

export function useDarajaConfig(configId: string) {
  return useQuery({
    queryKey: ['daraja-config', configId],
    queryFn: () => darajaConfigService.getConfigById(configId),
    enabled: !!configId,
  });
}

export function useCreateDarajaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: darajaConfigService.createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daraja-configs'] });
    },
  });
}

export function useUpdateDarajaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DarajaConfig> }) =>
      darajaConfigService.updateConfig(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daraja-configs'] });
      queryClient.invalidateQueries({ queryKey: ['daraja-config', variables.id] });
    },
  });
}

export function useDeleteDarajaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: darajaConfigService.deleteConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daraja-configs'] });
    },
  });
}

export function useDarajaTransactions(filters?: Parameters<typeof darajaTransactionService.getTransactions>[0]) {
  return useQuery({
    queryKey: ['daraja-transactions', filters],
    queryFn: () => darajaTransactionService.getTransactions(filters),
  });
}

export function useDarajaTransaction(transactionId: string) {
  return useQuery({
    queryKey: ['daraja-transaction', transactionId],
    queryFn: () => darajaTransactionService.getTransactionById(transactionId),
    enabled: !!transactionId,
  });
}

export function useInitiateSTKPush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: darajaTransactionService.initiateSTKPush,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daraja-transactions'] });
    },
  });
}

export function useQuerySTKStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutRequestId, configId }: { checkoutRequestId: string; configId: string }) =>
      darajaTransactionService.querySTKStatus(checkoutRequestId, configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daraja-transactions'] });
    },
  });
}

export function useDarajaDailySummary(businessId: string, date?: string) {
  return useQuery({
    queryKey: ['daraja-daily-summary', businessId, date],
    queryFn: () => darajaTransactionService.getDailySummary(businessId, date),
    enabled: !!businessId,
  });
}
