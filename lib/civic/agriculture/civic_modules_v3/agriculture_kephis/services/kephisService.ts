import { supabase } from "@/lib/supabase/client";
import {
  CropCertificate,
  SeedLicense,
  FarmInspection,
  PestDiseaseReport,
  AgriApplication,
  MarketPrice,
} from "../types";

const TABLE_CERTIFICATES = "crop_certificates";
const TABLE_SEED_LICENSES = "seed_licenses";
const TABLE_INSPECTIONS = "farm_inspections";
const TABLE_PEST_REPORTS = "pest_disease_reports";
const TABLE_APPLICATIONS = "agri_applications";
const TABLE_MARKET_PRICES = "market_prices";

export class KEPHISService {
  // ─── CROP CERTIFICATES ───
  static async getCertificates(userId: string): Promise<CropCertificate[]> {
    const { data, error } = await supabase
      .from(TABLE_CERTIFICATES)
      .select("*")
      .eq("user_id", userId)
      .order("expiry_date", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getCertificateById(id: string): Promise<CropCertificate | null> {
    const { data, error } = await supabase
      .from(TABLE_CERTIFICATES)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  static async createCertificate(cert: Omit<CropCertificate, "id" | "created_at" | "updated_at">): Promise<CropCertificate> {
    const { data, error } = await supabase
      .from(TABLE_CERTIFICATES)
      .insert(cert)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async revokeCertificate(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_CERTIFICATES)
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── SEED LICENSES ───
  static async getSeedLicenses(userId: string): Promise<SeedLicense[]> {
    const { data, error } = await supabase
      .from(TABLE_SEED_LICENSES)
      .select("*")
      .eq("user_id", userId)
      .order("expiry_date", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async createSeedLicense(license: Omit<SeedLicense, "id" | "created_at" | "updated_at">): Promise<SeedLicense> {
    const { data, error } = await supabase
      .from(TABLE_SEED_LICENSES)
      .insert(license)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async renewSeedLicense(id: string, newExpiry: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_SEED_LICENSES)
      .update({ expiry_date: newExpiry, status: "active", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── FARM INSPECTIONS ───
  static async getInspections(farmId?: string): Promise<FarmInspection[]> {
    let query = supabase
      .from(TABLE_INSPECTIONS)
      .select("*")
      .order("inspection_date", { ascending: false });
    if (farmId) query = query.eq("farm_id", farmId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createInspection(inspection: Omit<FarmInspection, "id" | "created_at">): Promise<FarmInspection> {
    const { data, error } = await supabase
      .from(TABLE_INSPECTIONS)
      .insert(inspection)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ─── PEST / DISEASE REPORTS ───
  static async getPestReports(county?: string): Promise<PestDiseaseReport[]> {
    let query = supabase
      .from(TABLE_PEST_REPORTS)
      .select("*")
      .order("created_at", { ascending: false });
    if (county) query = query.eq("county", county);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async reportPestDisease(report: Omit<PestDiseaseReport, "id" | "created_at" | "updated_at">): Promise<PestDiseaseReport> {
    const { data, error } = await supabase
      .from(TABLE_PEST_REPORTS)
      .insert(report)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updatePestStatus(id: string, status: PestDiseaseReport["status"]): Promise<void> {
    const { error } = await supabase
      .from(TABLE_PEST_REPORTS)
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // ─── APPLICATIONS ───
  static async getApplications(userId: string): Promise<AgriApplication[]> {
    const { data, error } = await supabase
      .from(TABLE_APPLICATIONS)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createApplication(app: Omit<AgriApplication, "id" | "created_at" | "updated_at">): Promise<AgriApplication> {
    const { data, error } = await supabase
      .from(TABLE_APPLICATIONS)
      .insert(app)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateApplicationStatus(id: string, status: AgriApplication["status"], reason?: string): Promise<void> {
    const update: any = { status, updated_at: new Date().toISOString() };
    if (reason) update.rejection_reason = reason;
    if (status === "completed") update.completion_date = new Date().toISOString();
    const { error } = await supabase.from(TABLE_APPLICATIONS).update(update).eq("id", id);
    if (error) throw error;
  }

  // ─── MARKET PRICES ───
  static async getMarketPrices(commodity?: string, county?: string): Promise<MarketPrice[]> {
    let query = supabase
      .from(TABLE_MARKET_PRICES)
      .select("*")
      .order("date_recorded", { ascending: false });
    if (commodity) query = query.eq("commodity", commodity);
    if (county) query = query.eq("county", county);
    const { data, error } = await query.limit(50);
    if (error) throw error;
    return data || [];
  }

  static async addMarketPrice(price: Omit<MarketPrice, "id" | "created_at">): Promise<MarketPrice> {
    const { data, error } = await supabase
      .from(TABLE_MARKET_PRICES)
      .insert(price)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ─── SEARCH ───
  static async searchCertificate(certNumber: string): Promise<CropCertificate | null> {
    const { data, error } = await supabase
      .from(TABLE_CERTIFICATES)
      .select("*")
      .eq("certificate_number", certNumber.toUpperCase())
      .single();
    if (error) return null;
    return data;
  }

  static async searchSeedLicense(licenseNumber: string): Promise<SeedLicense | null> {
    const { data, error } = await supabase
      .from(TABLE_SEED_LICENSES)
      .select("*")
      .eq("license_number", licenseNumber.toUpperCase())
      .single();
    if (error) return null;
    return data;
  }
}
