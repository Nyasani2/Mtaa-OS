import { supabase } from '@/lib/supabase';
import { channel } from '@/lib/kernel/communication/Channel';

export interface Business {
  id: string; owner_id: string; name: string;
  type: 'sole_proprietorship' | 'llc' | 'partnership' | 'cooperative';
  till_number?: string; paybill_number?: string;
  description?: string; category?: string; logo_url?: string;
  county?: string; sub_county?: string; ward?: string;
  phone?: string; email?: string;
  kra_pin?: string; business_reg_number?: string;
  documents: Array<{ type: string; url: string; verified: boolean; uploaded_at: string; }>;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string;
  fee_percentage: number;
  settlement_frequency: 'instant' | 'daily' | 'weekly' | 'monthly';
  settlement_threshold: number;
  bank_account?: { bank_name: string; account_number: string; account_name: string; branch: string; };
  mpesa_number?: string;
  created_at: string; updated_at: string;
}

export interface TillPayment {
  id: string; till_number: string; business_id: string;
  sender_phone: string; sender_name?: string;
  amount: number; status: string;
  mpesa_receipt?: string; settled: boolean; created_at: string;
}

export interface PaybillPayment {
  id: string; paybill_number: string; business_id: string; account_number: string;
  sender_phone: string; sender_name?: string;
  amount: number; status: string;
  mpesa_receipt?: string; settled: boolean; created_at: string;
}

class BusinessService {
  async registerBusiness(data: Omit<Business, 'id' | 'till_number' | 'paybill_number' | 'status' | 'created_at' | 'updated_at'>): Promise<Business> {
    const { data: business, error } = await supabase.from('businesses').insert({ ...data, status: 'pending' }).select().single();
    if (error) throw error;
    channel.publish('business', 'business_registered', { businessId: business.id, ownerId: business.owner_id, name: business.name }, { source: 'business-service', priority: 'normal' });
    return business;
  }

  async getBusiness(id: string): Promise<Business | null> {
    const { data, error } = await supabase.from('businesses').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async getMyBusiness(): Promise<Business | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single();
    if (error) return null;
    return data;
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase.from('businesses').update(updates).eq('id', id).select().single();
    if (error) throw error;
    channel.publish('business', 'business_updated', { businessId: id, updates: Object.keys(updates) }, { source: 'business-service', priority: 'normal' });
    return data;
  }

  async uploadDocument(businessId: string, file: File, docType: string): Promise<string> {
    const fileName = `business-docs/${businessId}/${docType}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('business-documents').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('business-documents').getPublicUrl(fileName);
    const { data: business } = await supabase.from('businesses').select('documents').eq('id', businessId).single();
    const newDoc = { type: docType, url: publicUrl, verified: false, uploaded_at: new Date().toISOString() };
    const updatedDocs = [...(business?.documents || []), newDoc];
    await supabase.from('businesses').update({ documents: updatedDocs }).eq('id', businessId);
    return publicUrl;
  }

  async getTillPayments(businessId: string, limit = 50): Promise<TillPayment[]> {
    const { data, error } = await supabase.from('till_payments').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  }

  async getPaybillPayments(businessId: string, limit = 50): Promise<PaybillPayment[]> {
    const { data, error } = await supabase.from('paybill_payments').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  }

  async getPaymentStats(businessId: string): Promise<{ totalTill: number; totalPaybill: number; todayTill: number; todayPaybill: number; pendingSettlement: number; }> {
    const today = new Date().toISOString().split('T')[0];
    const { data: tillStats } = await supabase.from('till_payments').select('amount, status, created_at').eq('business_id', businessId);
    const { data: paybillStats } = await supabase.from('paybill_payments').select('amount, status, created_at').eq('business_id', businessId);
    const totalTill = tillStats?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalPaybill = paybillStats?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const todayTill = tillStats?.filter(p => p.created_at?.startsWith(today)).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const todayPaybill = paybillStats?.filter(p => p.created_at?.startsWith(today)).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingSettlement = (tillStats?.filter(p => p.status === 'completed' && !p.settled).reduce((sum, p) => sum + (p.amount || 0), 0) || 0) + (paybillStats?.filter(p => p.status === 'completed' && !p.settled).reduce((sum, p) => sum + (p.amount || 0), 0) || 0);
    return { totalTill, totalPaybill, todayTill, todayPaybill, pendingSettlement };
  }

  async requestSettlement(businessId: string): Promise<void> {
    const { error } = await supabase.rpc('process_settlement', { p_business_id: businessId, p_payment_id: null, p_payment_type: 'all' });
    if (error) throw error;
    channel.publish('business', 'settlement_requested', { businessId, timestamp: Date.now() }, { source: 'business-service', priority: 'high' });
  }

  async initiateCustomerPayment(params: { type: 'till' | 'paybill'; number: string; accountNumber?: string; customerPhone: string; amount: number; }): Promise<{ checkoutRequestId: string; paymentId: string; }> {
    const { data, error } = await supabase.functions.invoke('business-stk-push', {
      body: { type: params.type, tillNumber: params.type === 'till' ? params.number : undefined, paybillNumber: params.type === 'paybill' ? params.number : undefined, accountNumber: params.accountNumber, customerPhone: params.customerPhone, amount: params.amount },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return { checkoutRequestId: data.checkoutRequestId, paymentId: data.paymentId };
  }
}

export const businessService = new BusinessService();
