import { supabase } from '@/lib/supabase';
import { CropCertificate, SeedLicense, FarmInspection, PestDiseaseReport, AgriApplication, MarketPrice } from '../types';

export class KEPHISService {
  // === STATIC METHODS (for controllers) ===

  static async getCertificates(userId?: string) {
    let query = supabase.from('kephis_certificates').select('*');
    if (userId) query = query.eq('applicant_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as CropCertificate[];
  }

  static async getSeedLicenses(userId?: string) {
    let query = supabase.from('kephis_seed_licenses').select('*');
    if (userId) query = query.eq('dealer_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as SeedLicense[];
  }

  static async getInspections(farmId?: string) {
    let query = supabase.from('kephis_inspections').select('*');
    if (farmId) query = query.eq('farm_id', farmId);
    const { data, error } = await query.order('inspection_date', { ascending: false });
    if (error) throw error;
    return data as FarmInspection[];
  }

  static async getPestReports(county?: string) {
    let query = supabase.from('kephis_pest_reports').select('*');
    if (county) query = query.eq('county', county);
    const { data, error } = await query.order('reported_at', { ascending: false });
    if (error) throw error;
    return data as PestDiseaseReport[];
  }

  static async getApplications(userId?: string) {
    let query = supabase.from('kephis_applications').select('*');
    if (userId) query = query.eq('applicant_id', userId);
    const { data, error } = await query.order('submitted_at', { ascending: false });
    if (error) throw error;
    return data as AgriApplication[];
  }

  static async getMarketPrices(commodity?: string, county?: string) {
    let query = supabase.from('kephis_market_prices').select('*');
    if (commodity) query = query.eq('commodity', commodity);
    if (county) query = query.eq('county', county);
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data as MarketPrice[];
  }

  static async createCertificate(cert: Omit<CropCertificate, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('kephis_certificates').insert(cert).select().single();
    if (error) throw error;
    return data as CropCertificate;
  }

  static async reportPestDisease(report: Omit<PestDiseaseReport, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('kephis_pest_reports').insert(report).select().single();
    if (error) throw error;
    return data as PestDiseaseReport;
  }

  static async scheduleInspection(farmId: string, inspectorId: string, date: string) {
    const { data, error } = await supabase.from('kephis_inspections').insert({
      farm_id: farmId, inspector_id: inspectorId, inspection_date: date, status: 'scheduled',
    }).select().single();
    if (error) throw error;
    return data as FarmInspection;
  }

  static async completeInspection(inspectionId: string, findings: string, status: FarmInspection['status']) {
    const { data, error } = await supabase.from('kephis_inspections')
      .update({ findings, status, completed_at: new Date().toISOString() })
      .eq('id', inspectionId).select().single();
    if (error) throw error;
    return data as FarmInspection;
  }

  static async approveCertificate(certId: string) {
    const { data, error } = await supabase.from('kephis_certificates')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', certId).select().single();
    if (error) throw error;
    return data as CropCertificate;
  }

  static async rejectCertificate(certId: string, reason: string) {
    const { data, error } = await supabase.from('kephis_certificates')
      .update({ status: 'rejected', rejection_reason: reason, rejected_at: new Date().toISOString() })
      .eq('id', certId).select().single();
    if (error) throw error;
    return data as CropCertificate;
  }

  static async verifyCertificate(certNumber: string): Promise<CropCertificate> {
    const { data, error } = await supabase.from('kephis_certificates').select('*').eq('certificate_number', certNumber).single();
    if (error) throw error;
    return data as CropCertificate;
  }

  static async searchCertificate(query: string): Promise<CropCertificate[]> {
    const { data, error } = await supabase.from('kephis_certificates')
      .select('*').or(`certificate_number.ilike.%${query}%,product_name.ilike.%${query}%,applicant_name.ilike.%${query}%`);
    if (error) throw error;
    return data as CropCertificate[];
  }

  static async getStats() {
    const { data, error } = await supabase.from('kephis_certificates').select('status', { count: 'exact' });
    if (error) throw error;
    const stats = { total: data?.length || 0, pending: 0, approved: 0, rejected: 0 };
    data?.forEach((row: any) => {
      if (row.status === 'pending') stats.pending++;
      else if (row.status === 'approved') stats.approved++;
      else if (row.status === 'rejected') stats.rejected++;
    });
    return stats;
  }

  // === INSTANCE METHODS (for components like CertVerify) ===

  async verifyCertificate(certNumber: string): Promise<CropCertificate> {
    return KEPHISService.verifyCertificate(certNumber);
  }

  async searchCertificate(query: string): Promise<CropCertificate[]> {
    return KEPHISService.searchCertificate(query);
  }

  async getCertificates(userId?: string) {
    return KEPHISService.getCertificates(userId);
  }

  async getSeedLicenses(userId?: string) {
    return KEPHISService.getSeedLicenses(userId);
  }

  async getInspections(farmId?: string) {
    return KEPHISService.getInspections(farmId);
  }

  async getPestReports(county?: string) {
    return KEPHISService.getPestReports(county);
  }

  async getApplications(userId?: string) {
    return KEPHISService.getApplications(userId);
  }

  async getMarketPrices(commodity?: string, county?: string) {
    return KEPHISService.getMarketPrices(commodity, county);
  }

  async createCertificate(cert: Omit<CropCertificate, 'id' | 'created_at' | 'updated_at'>) {
    return KEPHISService.createCertificate(cert);
  }

  async reportPestDisease(report: Omit<PestDiseaseReport, 'id' | 'created_at' | 'updated_at'>) {
    return KEPHISService.reportPestDisease(report);
  }

  async scheduleInspection(farmId: string, inspectorId: string, date: string) {
    return KEPHISService.scheduleInspection(farmId, inspectorId, date);
  }

  async completeInspection(inspectionId: string, findings: string, status: FarmInspection['status']) {
    return KEPHISService.completeInspection(inspectionId, findings, status);
  }

  async approveCertificate(certId: string) {
    return KEPHISService.approveCertificate(certId);
  }

  async rejectCertificate(certId: string, reason: string) {
    return KEPHISService.rejectCertificate(certId, reason);
  }

  async getStats() {
    return KEPHISService.getStats();
  }
}

export const kephisService = new KEPHISService();
