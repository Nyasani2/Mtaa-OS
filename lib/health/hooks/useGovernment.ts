import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface HealthAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  status: "active" | "dismissed";
  created_at: string;
}

export interface Outbreak {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  cases: number;
  status: "active" | "resolved";
  created_at: string;
}

export interface PopulationRecord {
  id: string;
  name: string | null;
  age: number;
  gender: string;
  city: string | null;
  vaccination_status: string | null;
  chronic_conditions: string[] | null;
}

export interface FacilityRecord {
  id: string;
  name: string;
  type: string | null;
  city: string | null;
  address: string | null;
  status: "pending" | "verified" | "rejected";
  departments: string[] | null;
  staff_count: number;
  license_number: string | null;
}

export function useGovernment(userId: string | undefined) {
  const [stats, setStats] = useState<{ facilities: number; verified: number; alerts: number } | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
  const [population, setPopulation] = useState<PopulationRecord[]>([]);
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setError(null);
    try {
      const [{ data: fData, error: fErr }, { data: aData, error: aErr }, { data: oData, error: oErr }, { data: pData, error: pErr }] = await Promise.all([
        supabase.from("health_facilities").select("id, status"),
        supabase.from("health_alerts").select("id, title, description, severity, location, status, created_at").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("health_outbreaks").select("id, title, description, severity, location, cases, status, created_at").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("health_population").select("id, name, age, gender, city, vaccination_status, chronic_conditions").limit(50),
      ]);
      if (fErr) throw fErr; if (aErr) throw aErr; if (oErr) throw oErr; if (pErr) throw pErr;

      const allFacilities = (fData || []) as FacilityRecord[];
      const verified = allFacilities.filter((f) => f.status === "verified").length;
      setStats({ facilities: allFacilities.length, verified, alerts: (aData || []).length });
      setAlerts((aData || []) as HealthAlert[]);
      setOutbreaks((oData || []) as Outbreak[]);
      setPopulation((pData || []) as PopulationRecord[]);
      setFacilities(allFacilities.filter((f) => f.status === "pending"));
    } catch (err: any) {
      console.error("[useGovernment] error:", err);
      setError(err.message || "Failed to load government data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refresh = useCallback(async () => { setRefreshing(true); await fetchAll(); }, [fetchAll]);

  const dismissAlert = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from("health_alerts").update({ status: "dismissed" }).eq("id", id);
      if (err) throw err;
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  }, []);

  const createOutbreak = useCallback(async (payload: { title: string; description: string; severity: string; location: string }) => {
    try {
      const { data, error: err } = await supabase.from("health_outbreaks").insert({
        title: payload.title, description: payload.description, severity: payload.severity,
        location: payload.location, cases: 0, status: "active", created_by: userId,
      }).select("id").single();
      if (err) throw err;
      await fetchAll();
      return { success: true, id: data.id };
    } catch (err: any) { return { success: false, error: err.message }; }
  }, [userId, fetchAll]);

  const verifyFacility = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from("health_facilities").update({ status: "verified", verified_at: new Date().toISOString(), verified_by: userId }).eq("id", id);
      if (err) throw err;
      setFacilities((prev) => prev.filter((f) => f.id !== id));
      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  }, [userId]);

  const rejectFacility = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from("health_facilities").update({ status: "rejected" }).eq("id", id);
      if (err) throw err;
      setFacilities((prev) => prev.filter((f) => f.id !== id));
      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  }, []);

  const searchPopulation = useCallback(async (query: string) => {
    try {
      const { data, error: err } = await supabase
        .from("health_population")
        .select("id, name, age, gender, city, vaccination_status, chronic_conditions")
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(50);
      if (err) throw err;
      setPopulation((data || []) as PopulationRecord[]);
    } catch (err: any) { setError(err.message); }
  }, []);

  return { stats, alerts, outbreaks, population, facilities, loading, error, refreshing, refresh, dismissAlert, createOutbreak, verifyFacility, rejectFacility, searchPopulation };
}
