import { supabase } from "@/lib/supabase/client";
import type { HealthAppointment } from "../types";
export class AppointmentService {
  static async getAppointments(userId: string, role: string): Promise<HealthAppointment[]> {
    let query = supabase.from("health_appointments").select("*");
    if (role === "patient") {
      const { data: patient } = await supabase.from("health_patients").select("id").eq("user_id", userId).single();
      query = query.eq("patient_id", patient?.id);
    } else if (role === "provider") {
      const { data: provider } = await supabase.from("health_providers").select("id").eq("user_id", userId).single();
      query = query.eq("provider_id", provider?.id);
    }
    const { data, error } = await query;
    if (error) throw error; return data || [];
  }
  static async book(appointmentData: Partial<HealthAppointment>): Promise<HealthAppointment> {
    const { data, error } = await supabase.from("health_appointments").insert(appointmentData).select().single();
    if (error) throw error; return data;
  }
  static async updateStatus(id: string, status: HealthAppointment["status"]): Promise<HealthAppointment> {
    const { data, error } = await supabase.from("health_appointments").update({ status }).eq("id", id).select().single();
    if (error) throw error; return data;
  }
  static async createAppointment(data: Partial<HealthAppointment>): Promise<HealthAppointment> {
    return this.book(data);
  }
  static async updateAppointmentStatus(id: string, status: string): Promise<void> {
    await this.updateStatus(id, status as HealthAppointment["status"]);
  }
  static async addToQueue(queueData: any): Promise<any> {
    const { data, error } = await supabase.from("health_queue").insert(queueData).select().single();
    if (error) throw error; return data;
  }
}