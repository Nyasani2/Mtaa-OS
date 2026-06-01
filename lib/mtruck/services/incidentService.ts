// lib/mtruck/services/incidentService.ts
// Incident reporting for "Report Issue" button

import { supabase } from "@/lib/supabase";

export async function reportIncident(payload: {
  load_id?: string;
  truck_id?: string;
  reporter_id: string;
  incident_type: "accident" | "breakdown" | "cargo_damage" | "delay" | "theft" | "other";
  severity?: "low" | "medium" | "high" | "critical";
  description?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  photos?: string[];
}) {
  const { data, error } = await supabase.from("mtruck_incidents").insert({
    ...payload,
    photos: payload.photos ? JSON.stringify(payload.photos) : "[]",
    status: "open",
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getIncidentsForUser(userId: string) {
  const { data, error } = await supabase
    .from("mtruck_incidents")
    .select("*, load:mtruck_loads(id, title), truck:mtruck_trucks(id, plate_number)")
    .or(`reporter_id.eq.${userId},load_id.in.(SELECT id FROM mtruck_loads WHERE shipper_id = '${userId}' OR driver_id = '${userId}')`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
