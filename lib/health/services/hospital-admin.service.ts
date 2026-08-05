
import { supabase } from '@/lib/supabase';

export const hospitalAdminService = {
  async getStats(facilityId: string) {
    const today = new Date().toISOString().split('T')[0];
    const [{ data: beds }, { data: staff }, { data: admissions }, { data: revenue }] = await Promise.all([
      supabase.from('health_beds').select('status').eq('facility_id', facilityId),
      supabase.from('health_staff').select('status').eq('facility_id', facilityId),
      supabase.from('health_admissions').select('id').eq('facility_id', facilityId).gte('admission_date', today),
      supabase.from('health_billing').select('amount').eq('facility_id', facilityId).gte('created_at', today),
    ]);
    return {
      totalBeds: beds?.length || 0,
      occupiedBeds: beds?.filter((b: any) => b.status === 'occupied').length || 0,
      totalStaff: staff?.length || 0,
      staffOnDuty: staff?.filter((s: any) => s.status === 'active').length || 0,
      todayAdmissions: admissions?.length || 0,
      todayRevenue: revenue?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0,
    };
  },

  async getBeds(facilityId: string) {
    const { data, error } = await supabase
      .from('health_beds')
      .select('*, health_admissions!inner(patient_id, patient:patient_id(name))')
      .eq('facility_id', facilityId)
      .order('bed_number');
    if (error) throw error;
    return (data || []).map((b: any) => ({
      id: b.id, bed_number: b.bed_number, ward: b.ward, room_type: b.room_type,
      floor: b.floor, status: b.status,
      patient_id: b.health_admissions?.[0]?.patient_id,
      patient_name: b.health_admissions?.[0]?.patient?.name,
    }));
  },

  async addBed(bedData: any) {
    const { error } = await supabase.from('health_beds').insert(bedData);
    if (error) throw error;
  },

  async updateBedStatus(bedId: string, status: string) {
    const { error } = await supabase.from('health_beds').update({ status }).eq('id', bedId);
    if (error) throw error;
  },

  async getAdmissions(facilityId: string) {
    const { data, error } = await supabase
      .from('health_admissions')
      .select('*, patient:patient_id(name), bed:bed_id(bed_number, ward), doctor:doctor_id(name)')
      .eq('facility_id', facilityId)
      .order('admission_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id, patient_id: a.patient_id, patient_name: a.patient?.name || 'Unknown',
      bed_number: a.bed?.bed_number || '', ward: a.bed?.ward || '',
      diagnosis: a.diagnosis || '', doctor_name: a.doctor?.name,
      admission_date: a.admission_date, status: a.status,
    }));
  },

  async admitPatient(admitData: any) {
    const { data, error } = await supabase.from('health_admissions').insert(admitData).select().maybeSingle();
    if (error) throw error;
    if (admitData.bed_id) {
      await supabase.from('health_beds').update({ status: 'occupied' }).eq('id', admitData.bed_id);
    }
    return data;
  },

  async getDischarges(facilityId: string) {
    const { data, error } = await supabase
      .from('health_beds')
      .select('*, patient:patient_id(name), bed:bed_id(bed_number, ward)')
      .eq('facility_id', facilityId)
      .order('discharge_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id, patient_id: d.patient_id, patient_name: d.patient?.name || 'Unknown',
      bed_number: d.bed?.bed_number || '', ward: d.bed?.ward || '',
      diagnosis: d.diagnosis || '', discharge_date: d.discharge_date,
      discharge_type: d.discharge_type, medications: d.medications,
    }));
  },

  async dischargePatient(admissionId: string, patientId: string, facilityId: string, dischargeData: any) {
    const { error: dErr } = await supabase.from('health_beds').insert({
      admission_id: admissionId, patient_id: patientId, facility_id: facilityId,
      ...dischargeData, discharge_date: new Date().toISOString(),
    });
    if (dErr) throw dErr;
    await supabase.from('health_admissions').update({ status: 'discharged' }).eq('id', admissionId);
    const { data: adm } = await supabase.from('health_admissions').select('bed_id').eq('id', admissionId).maybeSingle();
    if (adm?.bed_id) {
      await supabase.from('health_beds').update({ status: 'available' }).eq('id', adm.bed_id);
    }
  },

  async getStaff(facilityId: string) {
    const { data, error } = await supabase.from('health_staff').select('*').eq('facility_id', facilityId).order('name');
    if (error) throw error;
    return data || [];
  },

  async inviteStaff(staffData: any) {
    const { error } = await supabase.from('health_staff').insert(staffData);
    if (error) throw error;
  },
};
