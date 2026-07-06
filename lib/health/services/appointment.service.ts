import { supabase } from "@/lib/supabase";

export interface AppointmentPayload {
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  department: string;
  appointment_date: string;
  notes?: string;
}

export const appointmentService = {
  async getByPatient(patientId: string) {
    const { data, error } = await supabase
      .from("health_appointments")
      .select(`
        id, patient_id, doctor_id, hospital_id, department, appointment_date, status, notes, created_at,
        health_staff!health_appointments_doctor_id_fkey(name),
        health_facilities!health_appointments_hospital_id_fkey(name)
      `)
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      patient_id: row.patient_id,
      doctor_id: row.doctor_id,
      doctor_name: row.health_staff?.name || null,
      hospital_id: row.hospital_id,
      hospital_name: row.health_facilities?.name || null,
      department: row.department,
      appointment_date: row.appointment_date,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
    }));
  },

  async getByDoctor(doctorId: string) {
    const { data, error } = await supabase
      .from("health_appointments")
      .select(`
        id, patient_id, doctor_id, hospital_id, department, appointment_date, status, notes, created_at,
        user_profiles!health_appointments_patient_id_fkey(full_name)
      `)
      .eq("doctor_id", doctorId)
      .order("appointment_date", { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      patient_id: row.patient_id,
      patient_name: row.user_profiles?.full_name || null,
      hospital_id: row.hospital_id,
      department: row.department,
      appointment_date: row.appointment_date,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
    }));
  },

  async create(payload: AppointmentPayload) {
    const { data, error } = await supabase
      .from("health_appointments")
      .insert({
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id,
        hospital_id: payload.hospital_id,
        department: payload.department,
        appointment_date: payload.appointment_date,
        status: "scheduled",
        notes: payload.notes || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  async cancel(id: string) {
    const { error } = await supabase
      .from("health_appointments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("health_appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
