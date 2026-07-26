import { supabase } from '@/lib/supabase';
import { EducationStudentIdentity } from '../types/education.types';

export const studentIdentityService = {
  /**
   * Get student identity by student_id
   */
  async getByStudentId(studentId: string): Promise<EducationStudentIdentity | null> {
    const { data, error } = await supabase
      .from('education_student_identities')
      .select(`
        *,
        student:student_id (
          id, full_name, admission_number, date_of_birth, gender,
          current_level, stream, enrollment_status, enrolled_at,
          institution:institution_id (id, name, type, logo_url)
        )
      `)
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows
      throw new Error(error.message);
    }
    return data as EducationStudentIdentity;
  },

  /**
   * Get identity by card number (for QR scan)
   */
  async getByCardNumber(cardNumber: string): Promise<EducationStudentIdentity | null> {
    const { data, error } = await supabase
      .from('education_student_identities')
      .select(`
        *,
        student:student_id (
          id, full_name, admission_number, date_of_birth, gender,
          current_level, stream, enrollment_status,
          institution:institution_id (id, name, type, logo_url)
        )
      `)
      .eq('card_number', cardNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as EducationStudentIdentity;
  },

  /**
   * Get all identities for an institution (admin/teacher view)
   */
  async getByInstitution(institutionId: string, options?: { 
    search?: string; 
    status?: string; 
    limit?: number; 
    offset?: number;
  }): Promise<{ data: EducationStudentIdentity[]; count: number }> {
    let query = supabase
      .from('education_student_identities')
      .select(`
        *,
        student:student_id (id, full_name, admission_number, current_level, stream, enrollment_status)
      `, { count: 'exact' })
      .eq('institution_id', institutionId)
      .order('card_issued_at', { ascending: false });

    if (options?.status) {
      query = query.eq('card_status', options.status);
    }
    if (options?.search) {
      query = query.or(`student.full_name.ilike.%${options.search}%,card_number.ilike.%${options.search}%`);
    }
    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as EducationStudentIdentity[], count: count || 0 };
  },

  /**
   * Create identity record (admin/teacher only)
   */
  async create(payload: Partial<EducationStudentIdentity>): Promise<EducationStudentIdentity> {
    const { data, error } = await supabase
      .from('education_student_identities')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EducationStudentIdentity;
  },

  /**
   * Update identity record
   */
  async update(id: string, payload: Partial<EducationStudentIdentity>): Promise<EducationStudentIdentity> {
    const { data, error } = await supabase
      .from('education_student_identities')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EducationStudentIdentity;
  },

  /**
   * Generate QR code via edge function
   */
  async generateQR(studentId: string, institutionId: string): Promise<{ qr_code_url: string; qr_code_data: string }> {
    const { data, error } = await supabase.functions.invoke('generate-student-qr', {
      body: { student_id: studentId, institution_id: institutionId },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Get guardian's children (for parent portal)
   */
  async getGuardianChildren(guardianId: string): Promise<EducationStudentIdentity[]> {
    const { data, error } = await supabase
      .from('education_student_identities')
      .select(`
        *,
        student:student_id (
          id, full_name, admission_number, date_of_birth, gender,
          current_level, stream, enrollment_status,
          institution:institution_id (id, name, type, logo_url)
        )
      `)
      .or(`primary_guardian_id.eq.${guardianId},secondary_guardian_id.eq.${guardianId}`);

    if (error) throw new Error(error.message);
    return (data || []) as EducationStudentIdentity[];
  },

  /**
   * Update safety status (emergency/missing/safe)
   */
  async updateSafetyStatus(studentId: string, status: string, location?: { lat: number; lng: number }): Promise<void> {
    const update: any = { safety_status: status, updated_at: new Date().toISOString() };
    if (location) {
      update.last_location = { ...location, timestamp: new Date().toISOString(), source: 'manual_update' };
    }

    const { error } = await supabase
      .from('education_student_identities')
      .update(update)
      .eq('student_id', studentId);

    if (error) throw new Error(error.message);
  },

  /**
   * Add entry/exit log
   */
  async addEntryExitLog(studentId: string, log: { gate: string; direction: 'in' | 'out'; method: string }): Promise<void> {
    const { data: existing } = await supabase
      .from('education_student_identities')
      .select('entry_exit_logs')
      .eq('student_id', studentId)
      .single();

    const logs = existing?.entry_exit_logs || [];
    logs.unshift({ ...log, timestamp: new Date().toISOString() });

    // Keep last 100 logs
    const trimmedLogs = logs.slice(0, 100);

    const { error } = await supabase
      .from('education_student_identities')
      .update({ entry_exit_logs: trimmedLogs })
      .eq('student_id', studentId);

    if (error) throw new Error(error.message);
  },
};
