import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Facility {
  id: string;
  name: string;
  type: string | null;
  city: string | null;
  departments: string[] | null;
  insurance_accepted: string[] | null;
  rating: number | null;
}

export interface Doctor {
  id: string;
  name: string | null;
  specialization: string | null;
  hospital_id: string | null;
  hospital_name: string | null;
  experience_years: number | null;
  rating: number | null;
}

export function useFindCare() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [{ data: fData, error: fErr }, { data: dData, error: dErr }] = await Promise.all([
        supabase.from("health_facilities").select("id, name, type, city, departments, insurance_accepted, rating").limit(50),
        supabase.from("health_staff").select("id, name, specialization, hospital_id, experience_years, rating, health_facilities(name)").eq("role", "doctor").limit(50),
      ]);
      if (fErr) throw fErr;
      if (dErr) throw dErr;

      setFacilities((fData || []).map((f: any) => ({ ...f, departments: f.departments || [], insurance_accepted: f.insurance_accepted || [] })));
      setDoctors((dData || []).map((d: any) => ({ ...d, hospital_name: d.health_facilities?.name || null })));
    } catch (err: any) {
      console.error("[useFindCare] error:", err);
      setError(err.message || "Failed to load care providers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
  }, [fetchAll]);

  const searchFacilities = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("health_facilities")
        .select("id, name, type, city, departments, insurance_accepted, rating")
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,type.ilike.%${query}%`)
        .limit(50);
      if (err) throw err;
      setFacilities((data || []).map((f: any) => ({ ...f, departments: f.departments || [], insurance_accepted: f.insurance_accepted || [] })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchDoctors = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("health_staff")
        .select("id, name, specialization, hospital_id, experience_years, rating, health_facilities(name)")
        .eq("role", "doctor")
        .or(`name.ilike.%${query}%,specialization.ilike.%${query}%`)
        .limit(50);
      if (err) throw err;
      setDoctors((data || []).map((d: any) => ({ ...d, hospital_name: d.health_facilities?.name || null })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { facilities, doctors, loading, error, refreshing, refresh, searchFacilities, searchDoctors };
}
