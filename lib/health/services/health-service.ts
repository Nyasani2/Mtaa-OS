import { supabase } from '@/lib/supabase';

class HealthService {
  async getHealthRecords(userId: string) {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getAppointments(userId: string) {
    const { data, error } = await supabase
      .from('health_appointments')
      .select('*')
      .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
      .order('appointment_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async getPrescriptions(userId: string) {
    const { data, error } = await supabase
      .from('health_prescriptions')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getLabResults(userId: string) {
    const { data, error } = await supabase
      .from('health_lab_tests')
      .select('*')
      .eq('patient_id', userId)
      .order('test_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getInsurance(userId: string) {
    const { data, error } = await supabase
      .from('health_insurance')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getWalletBalance(userId: string) {
    const { data, error } = await supabase
      .from('health_wallet')
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return 0;
      throw error;
    }
    return data?.balance || 0;
  }
}

export const healthService = new HealthService();
