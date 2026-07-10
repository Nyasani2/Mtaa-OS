import { useState, useEffect } from "react";
import { supabase } from "@/lib/kernel/supabase";

export function usePatient(patientId?: string) {
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) { setLoading(false); return; }
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("health_// STUB_REMOVED: "patients"").select("*").eq("id", patientId).single();
        if (error) throw error;
        setPatient(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  return { patient, loading, error };
}
