// domains/business/services/businessService.ts
import { supabase } from '@/lib/supabase/client';

type BusinessType = 'sole_proprietorship' | 'llc' | 'partnership' | 'cooperative';
type BusinessStatus = 'pending' | 'active' | 'suspended' | 'closed';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
type SettlementFrequency = 'daily' | 'weekly' | 'monthly';

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  type: BusinessType;
  description: string;
  category: string;
  county: string;
  sub_county: string;
  ward: string;
  location: string;
  phone: string;
  email: string;
  kra_pin: string;
  business_reg_number: string;
  documents: Record<string, string>;
  status: BusinessStatus;
  till_number?: string;
  paybill_number?: string;
  fee_percentage: number;
  settlement_frequency: SettlementFrequency;
  settlement_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface TillPayment {
  id: string;
  business_id: string;
  till_number: string;
  sender_name: string;
  sender_phone: string;
  amount: number;
  status: PaymentStatus;
  settled: boolean;
  transaction_id?: string;
  created_at: string;
}

export interface PaybillPayment {
  id: string;
  business_id: string;
  paybill_number: string;
  account_number?: string;
  sender_name: string;
  sender_phone: string;
  amount: number;
  status: PaymentStatus;
  settled: boolean;
  transaction_id?: string;
  created_at: string;
}

export type BusinessPayment = TillPayment | PaybillPayment;

export interface BusinessDocument {
  id: string;
  business_id: string;
  type: 'kra_pin' | 'business_reg' | 'id_copy' | 'bank_statement' | 'other';
  file_url: string;
  status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
}

export const businessService = {
  async registerBusiness(data: Omit<Business, 'id' | 'status' | 'created_at' | 'updated_at' | 'till_number' | 'paybill_number'>): Promise<Business> {
    const { data: result, error } = await supabase
      .from('businesses')
      .insert({ ...data, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async getBusinessByOwner(ownerId: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', ownerId)
      .single();
    if (error) return null;
    return data;
  },

  async getBusinessById(id: string): Promise<Business | null> {
    const { data, error } = await supabase.from('businesses').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async getTillPayments(businessId: string): Promise<TillPayment[]> {
    const { data, error } = await supabase
      .from('till_payments')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getPaybillPayments(businessId: string): Promise<PaybillPayment[]> {
    const { data, error } = await supabase
      .from('paybill_payments')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getPaymentStats(businessId: string): Promise<{ pendingSettlement: number; totalRevenue: number; completedCount: number }> {
    const [tillRes, paybillRes] = await Promise.all([
      supabase.from('till_payments').select('amount, status, settled').eq('business_id', businessId),
      supabase.from('paybill_payments').select('amount, status, settled').eq('business_id', businessId),
    ]);

    const tillStats = (tillRes.data ?? []) as Array<{ amount: number; status: string; settled: boolean }>;
    const paybillStats = (paybillRes.data ?? []) as Array<{ amount: number; status: string; settled: boolean }>;

    const pendingSettlement = 
      tillStats.filter((p) => p.status === 'completed' && !p.settled)
        .reduce((sum, p) => sum + (p.amount || 0), 0) +
      paybillStats.filter((p) => p.status === 'completed' && !p.settled)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalRevenue = 
      tillStats.filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0) +
      paybillStats.filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const completedCount = 
      tillStats.filter((p) => p.status === 'completed').length +
      paybillStats.filter((p) => p.status === 'completed').length;

    return { pendingSettlement, totalRevenue, completedCount };
  },

  async uploadDocument(businessId: string, type: BusinessDocument['type'], fileUrl: string): Promise<BusinessDocument> {
    const { data, error } = await supabase
      .from('business_documents')
      .insert({ business_id: businessId, type, file_url: fileUrl, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDocuments(businessId: string): Promise<BusinessDocument[]> {
    const { data, error } = await supabase
      .from('business_documents')
      .select('*')
      .eq('business_id', businessId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

export default businessService;
