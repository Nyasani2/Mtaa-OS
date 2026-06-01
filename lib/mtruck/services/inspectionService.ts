// lib/mtruck/services/inspectionService.ts
// MTruck-specific inspections (NOT shared with MTaxi)

import { supabase } from "@/lib/supabase";

export async function scheduleInspection(payload: {
  truck_id: string;
  garage_id?: string;
  inspection_type?: string;
}) {
  const { data, error } = await supabase.from("mtruck_inspections").insert({
    ...payload,
    status: "pending",
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 year default
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getTruckInspections(truckId: string) {
  const { data, error } = await supabase
    .from("mtruck_inspections")
    .select("*, garage:mtaxi_garages(id, name, phone)")
    .eq("truck_id", truckId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitInspectionResults(
  inspectionId: string,
  results: {
    brakes_ok: boolean;
    tyres_ok: boolean;
    lights_ok: boolean;
    load_security_ok: boolean;
    fire_extinguisher_ok: boolean;
    first_aid_kit_ok: boolean;
    reflectors_ok: boolean;
    weight_capacity_verified: boolean;
    emissions_passed: boolean;
    notes?: string;
  }
) {
  const allPass = Object.values(results).every(v => v === true);
  const { data, error } = await supabase
    .from("mtruck_inspections")
    .update({
      ...results,
      status: allPass ? "passed" : "failed",
      inspected_at: new Date().toISOString(),
    })
    .eq("id", inspectionId)
    .select()
    .single();
  if (error) throw error;
  return { data, passed: allPass };
}
