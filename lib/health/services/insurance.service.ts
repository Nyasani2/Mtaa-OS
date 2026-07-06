import { supabase } from '@/lib/supabase';

export const insuranceService = {
  async getPatients() {
    const { data, error } = await supabase
      .from('health_patients')
      .select('id, full_name, phone')
      .eq('status', 'active')
      .order('full_name');
    if (error) throw error;
    return data || [];
  },

  async getPolicies() {
    const { data, error } = await supabase
      .from('health_insurance_policies')
      .select('id, patient_id, provider, policy_number, coverage_type, coverage_limit, deductible')
      .eq('status', 'active')
      .order('provider');
    if (error) throw error;
    return data || [];
  },

  async createClaim(data: any) {
    const { data: result, error } = await supabase
      .from('health_insurance_claims')
      .insert({
        patient_id: data.patient_id,
        policy_id: data.policy_id,
        claim_type: data.claim_type,
        amount: data.amount,
        description: data.description,
        diagnosis: data.diagnosis,
        provider_name: data.provider_name,
        provider_phone: data.provider_phone,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async getClaims(userId: string) {
    const { data, error } = await supabase
      .from('health_insurance_claims')
      .select(`
        id, claim_type, amount, description, status, created_at,
        patient:patient_id (full_name),
        policy:policy_id (provider, policy_number)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
