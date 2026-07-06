
import { supabase } from '@/lib/supabase/client';

export const nurseService = {
  async getMedications(facilityId: string) {
    const { data, error } = await supabase.from('health_medications').select('*, patient:patient_id(name)').eq('facility_id', facilityId).order('scheduled_time');
    if (error) throw error;
    return (data || []).map((m: any) => ({ ...m, patient_name: m.patient?.name }));
  },
  async addMedication(medData: any) {
    const { error } = await supabase.from('health_medications').insert(medData);
    if (error) throw error;
  },
  async administerMed(medId: string, patientId: string, userId: string, facilityId: string) {
    const { error } = await supabase.from('health_medication_logs').insert({
      medication_id: medId, patient_id: patientId, administered_by: userId,
      facility_id: facilityId, administered_at: new Date().toISOString(), status: 'given'
    });
    if (error) throw error;
  },
  async getVitals(facilityId: string) {
    const { data, error } = await supabase.from('health_vitals').select('*, patient:patient_id(name)').eq('facility_id', facilityId).order('recorded_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((v: any) => ({ ...v, patient_name: v.patient?.name }));
  },
  async recordVitals(vitalData: any, userId: string) {
    const { error } = await supabase.from('health_vitals').insert({ ...vitalData, recorded_by: userId, recorded_at: new Date().toISOString() });
    if (error) throw error;
  },
  async getHandovers(facilityId: string) {
    const { data, error } = await supabase.from('health_handovers').select('*, patient:patient_id(name), created_by:created_by(name)').eq('facility_id', facilityId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((h: any) => ({ ...h, patient_name: h.patient?.name, created_by_name: h.created_by?.name }));
  },
  async createHandover(handoverData: any, userId: string) {
    const { error } = await supabase.from('health_handovers').insert({ ...handoverData, created_by: userId, created_at: new Date().toISOString(), acknowledged: false });
    if (error) throw error;
  },
  async acknowledgeHandover(handoverId: string, userId: string) {
    const { error } = await supabase.from('health_handovers').update({ acknowledged: true, acknowledged_by: userId, acknowledged_at: new Date().toISOString() }).eq('id', handoverId);
    if (error) throw error;
  },
  async getActivePatients(facilityId: string) {
    const { data, error } = await supabase.from('health_admissions').select('patient_id, patient:patient_id(id, name)').eq('facility_id', facilityId).eq('status', 'active');
    if (error) throw error;
    return (data || []).map((a: any) => ({ id: a.patient_id, name: a.patient?.name || 'Unknown' }));
  }
};
