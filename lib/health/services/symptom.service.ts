import { supabase } from "@/lib/supabase";
import type { HealthSymptomCheck } from "../types";
export class SymptomService {
  static async getHistory(patientId: string): Promise<HealthSymptomCheck[]> {
    const { data, error } = await supabase.from("health_symptom_checks").select("*").eq("patient_id", patientId);
    if (error) throw error; return data || [];
  }
  static async checkSymptoms(checkData: Partial<HealthSymptomCheck>): Promise<HealthSymptomCheck> {
    const { data, error } = await supabase.from("health_symptom_checks").insert(checkData).select().single();
    if (error) throw error; return data;
  }
}