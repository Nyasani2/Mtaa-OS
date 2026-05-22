import { supabase } from "@/lib/supabase/client";
import type { HealthInsuranceClaim } from "../types";
export class InsuranceService {
  static async getClaims(patientId: string): Promise<HealthInsuranceClaim[]> {
    const { data, error } = await supabase.from("health_insurance_claims").select("*").eq("patient_id", patientId);
    if (error) throw error; return data || [];
  }
  static async submitClaim(claimData: Partial<HealthInsuranceClaim>): Promise<HealthInsuranceClaim> {
    const { data, error } = await supabase.from("health_insurance_claims").insert(claimData).select().single();
    if (error) throw error; return data;
  }
}