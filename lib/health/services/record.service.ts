import { supabase } from "@/lib/supabase/client";
import type { HealthRecord, HealthLabTest } from "../types";
export class RecordService {
  static async getRecords(patientId: string, type?: string): Promise<HealthRecord[]> {
    let query = supabase.from("health_records").select("*").eq("patient_id", patientId);
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) throw error; return data || [];
  }
  static async getPrescriptions(patientId: string): Promise<any[]> {
    const { data, error } = await supabase.from("health_prescriptions").select("*").eq("patient_id", patientId);
    if (error) throw error; return data || [];
  }
  static async getLabTests(patientId: string): Promise<HealthLabTest[]> {
    const { data, error } = await supabase.from("health_lab_tests").select("*").eq("patient_id", patientId);
    if (error) throw error; return data || [];
  }
}