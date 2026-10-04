// lib/mtaxi/services/inspectionService.ts
// Vehicle onboarding + inspection workflow service

import { supabase } from "@/lib/supabase";
import type { MtaxiInspectionOrder, MtaxiVehicleInspection, MtaxiVehicle } from "../types";

export async function onboardVehicle(payload: {
  driver_id: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  color?: string;
  plate_number: string;
  capacity?: number;
  garage_id?: string;
}) {
  const { data, error } = await supabase.functions.invoke("mtaxi-onboard-vehicle", { body: payload });
  if (error) throw error;
  return data as { success: boolean; vehicle: MtaxiVehicle; inspection_order?: MtaxiInspectionOrder; message: string };
}

export async function payInspectionFee(payload: {
  inspection_order_id: string;
  wallet_id: string;
  payment_method?: string;
}) {
  const { data, error } = await supabase.functions.invoke("mtaxi-inspection-payment", { body: payload });
  if (error) throw error;
  return data as { success: boolean; escrow: any; payment: any; message: string };
}

export async function completeInspection(payload: {
  inspection_order_id: string;
  inspector_id: string;
  fire_extinguisher: boolean;
  first_aid_kit: boolean;
  triangles: boolean;
  tyres: boolean;
  lights: boolean;
  brakes: boolean;
  notes?: string;
}) {
  const { data, error } = await supabase.functions.invoke("mtaxi-inspection-complete", { body: payload });
  if (error) throw error;
  return data as { success: boolean; result: "pass" | "fail"; inspection: MtaxiVehicleInspection; message: string };
}

export async function approveVehicle(payload: {
  vehicle_id: string;
  marshal_id: string;
  action: "approve" | "reject";
  rejection_reason?: string;
}) {
  const { data, error } = await supabase.functions.invoke("mtaxi-vehicle-approval", { body: payload });
  if (error) throw error;
  return data as { success: boolean; vehicle_id: string; status: string; message: string };
}

// Direct Supabase queries for UI lists
export async function getDriverInspectionOrders(driverId: string) {
  const { data, error } = await supabase
    .from("mtaxi_inspection_orders")
    .select("*, vehicle:mtaxi_vehicles(*), garage:mtaxi_garages(id, name, phone, location)")
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as MtaxiInspectionOrder[];
}

export async function getGarageInspectionOrders(garageId: string) {
  const { data, error } = await supabase
    .from("mtaxi_inspection_orders")
    .select("*, vehicle:mtaxi_vehicles(*), driver:mtaxi_drivers(id, full_name, phone)")
    .eq("garage_id", garageId)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as MtaxiInspectionOrder[];
}

export async function getPendingApprovals() {
  const { data, error } = await supabase
    .from("mtaxi_vehicles")
    .select("*, driver:mtaxi_drivers(id, full_name, phone), inspection:mtaxi_vehicle_inspections(*)")
    .eq("inspection_status", "passed")
    .eq("is_active", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as MtaxiVehicle[];
}


// ─── UNIVERSAL INSPECTION QUEUE (For Approved Garages Only) ───
export async function getUniversalInspectionQueue(garageId: string, garageStatus: string) {
  // STRICT GATE: Only approved garages can see the universal queue
  if (garageStatus !== 'approved') {
    throw new Error('Access Denied: Only MTAA-approved garages can access the universal inspection queue.');
  }

  const { data, error } = await supabase
    .from("mtaxi_inspection_orders")
    .select("*, vehicle:mtaxi_vehicles(*), driver:mtaxi_drivers(id, full_name, phone)")
    .eq("status", "pending") // Fetch all pending inspections across the entire MTAA platform
    .eq("payment_status", "paid") // Only show inspections that the vehicle owner has paid for
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as MtaxiInspectionOrder[];
}

export async function claimAndCompleteInspection(payload: {
  inspection_order_id: string;
  garage_id: string;
  garage_status: string;
  inspector_id: string;
  fire_extinguisher: boolean;
  first_aid_kit: boolean;
  triangles: boolean;
  tyres: boolean;
  lights: boolean;
  brakes: boolean;
  notes?: string;
}) {
  // STRICT GATE: Ensure the garage performing the inspection is approved
  if (payload.garage_status !== 'approved') {
    throw new Error('Access Denied: Only MTAA-approved garages can perform inspections.');
  }

  // 1. Link this inspection order to the garage performing the work
  const { error: updateError } = await supabase
    .from("mtaxi_inspection_orders")
    .update({ 
      garage_id: payload.garage_id, 
      status: "in_progress" 
    })
    .eq("id", payload.inspection_order_id)
    .is("garage_id", null); // Only claim if it hasn't been claimed by another garage yet

  if (updateError) throw new Error("Failed to claim inspection order. It may have been claimed by another garage.");

  // 2. Proceed with the actual inspection logic (calling the edge function)
  const { data, error } = await supabase.functions.invoke("mtaxi-inspection-complete", { 
    body: {
      inspection_order_id: payload.inspection_order_id,
      inspector_id: payload.inspector_id,
      fire_extinguisher: payload.fire_extinguisher,
      first_aid_kit: payload.first_aid_kit,
      triangles: payload.triangles,
      tyres: payload.tyres,
      lights: payload.lights,
      brakes: payload.brakes,
      notes: payload.notes
    } 
  });
  
  if (error) throw error;
  return data as { success: boolean; result: "pass" | "fail"; inspection: any; message: string };
}
