import { supabase } from "@/lib/supabase/client";
import type { HealthTelemedicineSession } from "../types";
export class TelemedicineService {
  static async getSession(sessionId: string): Promise<HealthTelemedicineSession | null> {
    const { data, error } = await supabase.from("health_telemedicine_sessions").select("*").eq("id", sessionId).single();
    if (error) return null; return data;
  }
  static async startSession(sessionData: Partial<HealthTelemedicineSession>): Promise<HealthTelemedicineSession> {
    const { data, error } = await supabase.from("health_telemedicine_sessions").insert(sessionData).select().single();
    if (error) throw error; return data;
  }
  static async endSession(sessionId: string): Promise<void> {
    await supabase.from("health_telemedicine_sessions").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", sessionId);
  }
}