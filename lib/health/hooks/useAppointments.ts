import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string | null;
  hospital_id: string | null;
  hospital_name: string | null;
  department: string | null;
  appointment_date: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show" | "in_progress";
  notes: string | null;
  created_at: string;
}

export function useAppointments(userId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("health_appointments")
        .select(`
          id, patient_id, doctor_id, hospital_id, department, appointment_date, status, notes, created_at,
          health_staff!health_appointments_doctor_id_fkey(name),
          health_facilities!health_appointments_hospital_id_fkey(name)
        `)
        .eq("patient_id", userId)
        .order("appointment_date", { ascending: false });

      if (err) throw err;

      const mapped = (data || []).map((row: any) => ({
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

      setAppointments(mapped);
    } catch (err: any) {
      console.error("[useAppointments] fetch error:", err);
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
  }, [fetchAppointments]);

  const cancelAppointment = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: err } = await supabase
        .from("health_appointments")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (err) throw err;
      await fetchAppointments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchAppointments]);

  const bookAppointment = useCallback(async (payload: {
    doctor_id: string; hospital_id: string; department: string;
    appointment_date: string; notes?: string;
  }): Promise<{ success: boolean; error?: string; id?: string }> => {
    if (!userId) return { success: false, error: "Not authenticated" };
    try {
      const { data, error: err } = await supabase
        .from("health_appointments")
        .insert({
          patient_id: userId,
          doctor_id: payload.doctor_id,
          hospital_id: payload.hospital_id,
          department: payload.department,
          appointment_date: payload.appointment_date,
          status: "scheduled",
          notes: payload.notes || null,
        })
        .select("id")
        .maybeSingle();
      if (err) throw err;
      await fetchAppointments();
      return { success: true, id: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [userId, fetchAppointments]);

  return { appointments, loading, error, refreshing, refresh, cancelAppointment, bookAppointment };
}
