import { supabase } from '@/lib/supabase';
import {
  EducationInstitutionProfile,
  EducationVerificationLog,
  EducationInstitutionDocument,
} from '../types/education.types';

export const institutionProfileService = {
  /**
   * Get institution profile with full details
   */
  async getProfile(institutionId: string): Promise<EducationInstitutionProfile | null> {
    const { data, error } = await supabase
      .from('education_institution_profiles')
      .select(`
        *,
        institution:institution_id (
          id, name, type, category, registration_number, kra_pin,
          ministry_approved, approved_at, address, city, county, sub_county, ward,
          phone, email, website, logo_url, cover_image_url, gallery,
          head_teacher_id, head_teacher_name, head_teacher_phone,
          levels_offered, boarding, day_school, mixed_gender, capacity,
          status, verification_status, created_at, updated_at,
          head_teacher:head_teacher_id (id, email, raw_user_meta_data)
        )
      `)
      .eq('institution_id', institutionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as EducationInstitutionProfile;
  },

  /**
   * Create or update institution profile
   */
  async upsertProfile(payload: Partial<EducationInstitutionProfile>): Promise<EducationInstitutionProfile> {
    const { data, error } = await supabase
      .from('education_institution_profiles')
      .upsert(payload, { onConflict: 'institution_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EducationInstitutionProfile;
  },

  /**
   * Get verification logs for an institution
   */
  async getVerificationLogs(institutionId: string): Promise<EducationVerificationLog[]> {
    const { data, error } = await supabase
      .from('education_verification_logs')
      .select('*')
      .eq('institution_id', institutionId)
      .order('step_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as EducationVerificationLog[];
  },

  /**
   * Submit a verification step
   */
  async submitVerificationStep(payload: Partial<EducationVerificationLog>): Promise<EducationVerificationLog> {
    const { data, error } = await supabase
      .from('education_verification_logs')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update institution verification status
    await supabase
      .from('education_institutions')
      .update({ verification_status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', payload.institution_id);

    return data as EducationVerificationLog;
  },

  /**
   * Complete a verification step
   */
  async completeVerificationStep(logId: string, updates: Partial<EducationVerificationLog>): Promise<void> {
    const { error } = await supabase
      .from('education_verification_logs')
      .update({
        ...updates,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId);

    if (error) throw new Error(error.message);
  },

  /**
   * Reject with reason
   */
  async rejectVerification(logId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('education_verification_logs')
      .update({
        status: 'failed',
        rejection_reason: reason,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId);

    if (error) throw new Error(error.message);
  },

  /**
   * Get institution documents
   */
  async getDocuments(institutionId: string): Promise<EducationInstitutionDocument[]> {
    const { data, error } = await supabase
      .from('education_institution_documents')
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as EducationInstitutionDocument[];
  },

  /**
   * Upload document reference
   */
  async uploadDocument(payload: Partial<EducationInstitutionDocument>): Promise<EducationInstitutionDocument> {
    const { data, error } = await supabase
      .from('education_institution_documents')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EducationInstitutionDocument;
  },

  /**
   * Verify a document (ministry officer)
   */
  async verifyDocument(docId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    const { error } = await supabase
      .from('education_institution_documents')
      .update({
        verification_status: status,
        verified_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', docId);

    if (error) throw new Error(error.message);
  },

  /**
   * Get verification statistics for ministry dashboard
   */
  async getVerificationStats(): Promise<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    by_type: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('education_institutions')
      .select('verification_status, type');

    if (error) throw new Error(error.message);

    const stats = { total: 0, pending: 0, verified: 0, rejected: 0, by_type: {} as Record<string, number> };
    (data || []).forEach((inst: any) => {
      stats.total++;
      if (inst.verification_status === 'verified') stats.verified++;
      else if (inst.verification_status === 'rejected') stats.rejected++;
      else stats.pending++;
      stats.by_type[inst.type] = (stats.by_type[inst.type] || 0) + 1;
    });

    return stats;
  },

  /**
   * Approve institution (ministry final approval)
   */
  async approveInstitution(institutionId: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('education_institutions')
      .update({
        ministry_approved: true,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        verification_status: 'verified',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', institutionId);

    if (error) throw new Error(error.message);
  },
};
