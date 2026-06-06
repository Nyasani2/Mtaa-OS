import { supabase } from '@/lib/supabase';

export interface BusinessProfile {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  category: string;
  registration_number?: string;
  tax_pin?: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  description?: string;
  status: 'active' | 'pending' | 'suspended';
  verified: boolean;
  revenue_today: number;
  revenue_month: number;
  transaction_count: number;
  created_at: string;
}

export interface BusinessDocument {
  id: string;
  business_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
  verified_at?: string;
  notes?: string;
}

export interface BusinessTransaction {
  id: string;
  business_id: string;
  type: 'payment_received' | 'payment_sent' | 'refund' | 'withdrawal';
  amount: number;
  customer_name?: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export const businessService = {
  async getBusinesses(ownerId: string) {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    return { data: data as BusinessProfile[] | null, error };
  },

  async getBusinessById(id: string) {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single();
    return { data: data as BusinessProfile | null, error };
  },

  async createBusiness(business: Omit<BusinessProfile, 'id' | 'created_at' | 'revenue_today' | 'revenue_month' | 'transaction_count'>) {
    const { data, error } = await supabase
      .from('business_profiles')
      .insert({
        ...business,
        revenue_today: 0,
        revenue_month: 0,
        transaction_count: 0,
      })
      .select()
      .single();
    return { data: data as BusinessProfile | null, error };
  },

  async updateBusiness(id: string, updates: Partial<BusinessProfile>) {
    const { data, error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as BusinessProfile | null, error };
  },

  async getDocuments(businessId: string) {
    const { data, error } = await supabase
      .from('business_documents')
      .select('*')
      .eq('business_id', businessId)
      .order('uploaded_at', { ascending: false });
    return { data: data as BusinessDocument[] | null, error };
  },

  async uploadDocument(doc: Omit<BusinessDocument, 'id' | 'uploaded_at' | 'verified_at'>) {
    const { data, error } = await supabase
      .from('business_documents')
      .insert(doc)
      .select()
      .single();
    return { data: data as BusinessDocument | null, error };
  },

  async getTransactions(businessId: string, limit = 50) {
    const { data, error } = await supabase
      .from('business_transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: data as BusinessTransaction[] | null, error };
  },

  async recordTransaction(tx: Omit<BusinessTransaction, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('business_transactions')
      .insert(tx)
      .select()
      .single();
    return { data: data as BusinessTransaction | null, error };
  },
};
