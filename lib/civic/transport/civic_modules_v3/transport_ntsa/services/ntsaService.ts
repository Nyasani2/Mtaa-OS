import { supabase } from "@/lib/supabase/client";
import {
  DrivingLicense,
  VehicleRegistration,
  InspectionRecord,
  TrafficOffence,
  NTSAApplication,
  RoadIncident,
} from "../types";

const TABLE_LICENSES = "driving_licenses";
const TABLE_VEHICLES = "vehicle_registrations";
const TABLE_INSPECTIONS = "vehicle_inspections";
const TABLE_OFFENCES = "traffic_offences";
const TABLE_APPLICATIONS = "ntsa_applications";
const TABLE_INCIDENTS = "road_incidents";

export class NTSAService {
  // ─── DRIVING LICENSES ───
  static async getLicenses(userId: string): Promise<DrivingLicense[]> {
    const { data, error } = await supabase
      .from(TABLE_LICENSES)
      .select("*")
      .eq("user_id", userId)
      .order("expiry_date", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getLicenseById(id: string): Promise<DrivingLicense | null> {
    const { data, error } = await supabase
      .from(TABLE_LICENSES)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  static async createLicense(license: Omit<DrivingLicense, "id" | "created_at" | "updated_at">): Promise<DrivingLicense> {
    const { data, error } = await supabase
      .from(TABLE_LICENSES)
      .insert(license)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async renewLicense(id: string, newExpiry: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_LICENSES)
      .update({ expiry_date: newExpiry, status: "active", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── VEHICLE REGISTRATIONS ───
  static async getVehicles(userId: string): Promise<VehicleRegistration[]> {
    const { data, error } = await supabase
      .from(TABLE_VEHICLES)
      .select("*")
      .eq("user_id", userId)
      .order("registration_date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getVehicleById(id: string): Promise<VehicleRegistration | null> {
    const { data, error } = await supabase
      .from(TABLE_VEHICLES)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  static async registerVehicle(vehicle: Omit<VehicleRegistration, "id" | "created_at" | "updated_at">): Promise<VehicleRegistration> {
    const { data, error } = await supabase
      .from(TABLE_VEHICLES)
      .insert(vehicle)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async transferVehicle(id: string, newUserId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_VEHICLES)
      .update({ user_id: newUserId, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── INSPECTIONS ───
  static async getInspections(vehicleId: string): Promise<InspectionRecord[]> {
    const { data, error } = await supabase
      .from(TABLE_INSPECTIONS)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("inspection_date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createInspection(inspection: Omit<InspectionRecord, "id" | "created_at">): Promise<InspectionRecord> {
    const { data, error } = await supabase
      .from(TABLE_INSPECTIONS)
      .insert(inspection)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ─── TRAFFIC OFFENCES ───
  static async getOffences(userId: string): Promise<TrafficOffence[]> {
    const { data, error } = await supabase
      .from(TABLE_OFFENCES)
      .select("*")
      .eq("offender_id", userId)
      .order("offence_date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getOffenceById(id: string): Promise<TrafficOffence | null> {
    const { data, error } = await supabase
      .from(TABLE_OFFENCES)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  static async payFine(id: string, paymentRef: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_OFFENCES)
      .update({ status: "paid", payment_reference: paymentRef, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  static async contestOffence(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_OFFENCES)
      .update({ status: "contested", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── APPLICATIONS ───
  static async getApplications(userId: string): Promise<NTSAApplication[]> {
    const { data, error } = await supabase
      .from(TABLE_APPLICATIONS)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createApplication(app: Omit<NTSAApplication, "id" | "created_at" | "updated_at">): Promise<NTSAApplication> {
    const { data, error } = await supabase
      .from(TABLE_APPLICATIONS)
      .insert(app)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateApplicationStatus(id: string, status: NTSAApplication["status"], reason?: string): Promise<void> {
    const update: any = { status, updated_at: new Date().toISOString() };
    if (reason) update.rejection_reason = reason;
    if (status === "completed") update.completion_date = new Date().toISOString();
    const { error } = await supabase.from(TABLE_APPLICATIONS).update(update).eq("id", id);
    if (error) throw error;
  }

  // ─── ROAD INCIDENTS ───
  static async getIncidents(county?: string): Promise<RoadIncident[]> {
    let query = supabase
      .from(TABLE_INCIDENTS)
      .select("*")
      .order("created_at", { ascending: false });
    if (county) query = query.eq("county", county);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async reportIncident(incident: Omit<RoadIncident, "id" | "created_at" | "updated_at">): Promise<RoadIncident> {
    const { data, error } = await supabase
      .from(TABLE_INCIDENTS)
      .insert(incident)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateIncidentStatus(id: string, status: RoadIncident["status"]): Promise<void> {
    const { error } = await supabase
      .from(TABLE_INCIDENTS)
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── SEARCH ───
  static async searchPlate(plateNumber: string): Promise<VehicleRegistration | null> {
    const { data, error } = await supabase
      .from(TABLE_VEHICLES)
      .select("*")
      .eq("plate_number", plateNumber.toUpperCase())
      .single();
    if (error) return null;
    return data;
  }

  static async searchLicense(licenseNumber: string): Promise<DrivingLicense | null> {
    const { data, error } = await supabase
      .from(TABLE_LICENSES)
      .select("*")
      .eq("license_number", licenseNumber.toUpperCase())
      .single();
    if (error) return null;
    return data;
  }
}
