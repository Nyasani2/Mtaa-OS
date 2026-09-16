import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/lib/supabase";

export interface Appointment {
  id: string;
  patient_id: string;
  staff_id: string;
  doctor_name: string | null;
  facility_id: string | null;
  hospital_name: string | null;
  department: string | null;
  scheduled_date: string;
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
          id, patient_id, staff_id, facility_id, scheduled_date, status, notes, created_at,
          health_staff:staff_id(id, full_name, role),
          health_facilities:facility_id(id, name)
        `)
        .eq("patient_id", userId)
        .order("scheduled_date", { ascending: false });
      if (err) throw err;
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        patient_id: row.patient_id,
        staff_id: row.staff_id,
        doctor_name: row.health_staff?.name || null,
        facility_id: row.facility_id,
        hospital_name: row.health_facilities?.name || null,
        department: row.department,
        scheduled_date: row.scheduled_date,
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
    staff_id: string; facility_id: string; department: string;
    scheduled_date: string; notes?: string;
  }): Promise<{ success: boolean; error?: string; id?: string }> => {
    if (!userId) return { success: false, error: "Not authenticated" };
    try {
      const { data, error: err } = await supabase
        .from("health_appointments")
        .insert({
          patient_id: userId,
          staff_id: payload.staff_id,
          facility_id: payload.facility_id,
          department: payload.department,
          scheduled_date: payload.scheduled_date,
          status: "scheduled",
          notes: payload.notes || null,
        })
        .select("id")
        .maybeSingle();
      if (err) throw err;
      await fetchAppointments();
      return { success: true, id: data?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [userId, fetchAppointments]);

  return { data: appointments, isLoading: loading, appointments, loading, error, refreshing, refresh, cancelAppointment, bookAppointment };
}
