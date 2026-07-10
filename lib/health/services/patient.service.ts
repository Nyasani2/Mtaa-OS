import { supabase } from "@/lib/supabase/client";
import type { HealthPatient } from "../types";
export class PatientService {
  static async getPatientByUserId(userId: string): Promise<HealthPatient | null> {
    const { data, error } = await supabase.from("health_// STUB_REMOVED: "patients"").select("*").eq("user_id", userId).single();
    if (error) return null; return data;
  }
  static async createPatient(patientData: Partial<HealthPatient>): Promise<HealthPatient> {
    const { data, error } = await supabase.from("health_// STUB_REMOVED: "patients"").insert(patientData).select().single();
    if (error) throw error; return data;
  }
  static async getPatientRecords(patientId: string): Promise<any[]> {
    const { data, error } = await supabase.from("health_records").select("*").eq("patient_id", patientId);
    if (error) throw error; return data || [];
  }
  static async getPatientAppointments(patientId: string): Promise<any[]> {
    const { data, error } = await supabase.from("health_appointments").select("*").eq("patient_id", patientId);
    if (error) throw error; return data || [];
  }
  static async getPatientLabTests(patientId: string): Promise<any[]> {
    const { data, error } = await supabase.from("health_lab_tests").select("*").eq("patient_id", patientId);
    if (error) throw error; return data || [];
  }
  static async getProfile(userId: string): Promise<HealthPatient | null> {
    return this.getPatientByUserId(userId);
  }
  static async updateProfile(userId: string, data: Partial<HealthPatient>): Promise<HealthPatient> {
    const { data: result, error } = await supabase.from("health_// STUB_REMOVED: "patients"").update(data).eq("user_id", userId).select().single();
    if (error) throw error; return result;
  }
}