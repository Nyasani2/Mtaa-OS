import { supabase } from "@/lib/supabase";
import type { HealthProvider } from "../types";
export class ProviderService {
  static async getProviders(filters?: any): Promise<HealthProvider[]> {
    let query = supabase.from("health_providers").select("*");
    if (filters?.specialty) query = query.eq("specialty", filters.specialty);
    if (filters?.city) query = query.eq("city", filters.city);
    const { data, error } = await query;
    if (error) throw error; return data || [];
  }
  static async getProvider(id: string): Promise<HealthProvider | null> {
    const { data, error } = await supabase.from("health_providers").select("*").eq("id", id).single();
    if (error) return null; return data;
  }
  static async getFacilities(filters?: any): Promise<any[]> {
    const { data, error } = await supabase.from("health_hospitals").select("*");
    if (error) throw error; return data || [];
  }
}