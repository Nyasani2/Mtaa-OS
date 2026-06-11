import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/kernel/supabase";

export function useAppointments(patientId?: string) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("health_appointments").select("*").order("scheduled_at", { ascending: true });
      if (patientId) query = query.eq("patient_id", patientId);
      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const bookAppointment = async (data: any) => {
    const { error } = await supabase.from("health_appointments").insert(data);
    if (error) throw error;
    await fetchAppointments();
  };

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase.from("health_appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;
    await fetchAppointments();
  };

  return { appointments, loading, error, bookAppointment, cancelAppointment, refresh: fetchAppointments };
}
