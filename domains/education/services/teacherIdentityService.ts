import { supabase } from '@/lib/supabase';
import { EducationTeacherIdentity } from '../types/education.types';

export const teacherIdentityService = {
  /**
   * Get teacher identity by teacher_id
   */
  async getByTeacherId(teacherId: string): Promise<EducationTeacherIdentity | null> {
    const { data, error } = await supabase
      .from('education_teacher_identities')
      .select(`
        *,
        teacher:teacher_id (
          id, full_name, phone, email, id_number, tsc_number, license_number,
          specialization, qualifications, years_experience, employment_type,
          subjects_taught, classes_assigned, is_class_teacher, salary_grade,
          is_active, joined_at,
          institution:institution_id (id, name, type, logo_url)
        )
      `)
      .eq('teacher_id', teacherId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as EducationTeacherIdentity;
  },

  /**
   * Get identity by card number (QR scan)
   */
  async getByCardNumber(cardNumber: string): Promise<EducationTeacherIdentity | null> {
    const { data, error } = await supabase
      .from('education_teacher_identities')
      .select(`
        *,
        teacher:teacher_id (
          id, full_name, phone, email, tsc_number, specialization,
          subjects_taught, is_active,
          institution:institution_id (id, name, type, logo_url)
        )
      `)
      .eq('card_number', cardNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as EducationTeacherIdentity;
  },

  /**
   * Get all teacher identities for an institution
   */
  async getByInstitution(institutionId: string, options?: {
    search?: string;
    accessLevel?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: EducationTeacherIdentity[]; count: number }> {
    let query = supabase
      .from('education_teacher_identities')
      .select(`
        *,
        teacher:teacher_id (id, full_name, phone, email, tsc_number, specialization, is_active)
      `, { count: 'exact' })
      .eq('institution_id', institutionId)
      .order('card_issued_at', { ascending: false });

    if (options?.status) query = query.eq('card_status', options.status);
    if (options?.accessLevel) query = query.eq('access_level', options.accessLevel);
    if (options?.search) {
      query = query.or(`teacher.full_name.ilike.%${options.search}%,card_number.ilike.%${options.search}%`);
    }
    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as EducationTeacherIdentity[], count: count || 0 };
  },

  /**
   * Create identity record
   */
  async create(payload: Partial<EducationTeacherIdentity>): Promise<EducationTeacherIdentity> {
    const { data, error } = await supabase
      .from('education_teacher_identities')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EducationTeacherIdentity;
  },

  /**
   * Update identity record
   */
  async update(id: string, payload: Partial<EducationTeacherIdentity>): Promise<EducationTeacherIdentity> {
    const { data, error } = await supabase
      .from('education_teacher_identities')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EducationTeacherIdentity;
  },

  /**
   * Generate QR code via edge function
   */
  async generateQR(teacherId: string, institutionId: string): Promise<{ qr_code_url: string; qr_code_data: string }> {
    const { data, error } = await supabase.functions.invoke('generate-teacher-qr', {
      body: { teacher_id: teacherId, institution_id: institutionId },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update performance metrics (called by analytics/triggers)
   */
  async updateMetrics(teacherId: string, metrics: Partial<{
    attendance_rate: number;
    punctuality_rate: number;
    student_progress_rate: number;
    parent_satisfaction_rate: number;
    total_lessons_delivered: number;
    total_students_taught: number;
  }>): Promise<void> {
    const { error } = await supabase
      .from('education_teacher_identities')
      .update({ ...metrics, updated_at: new Date().toISOString() })
      .eq('teacher_id', teacherId);

    if (error) throw new Error(error.message);
  },

  /**
   * Record check-in/check-out
   */
  async recordCheckInOut(teacherId: string, action: 'check_in' | 'check_out', location?: { lat: number; lng: number }): Promise<void> {
    const update: any = { updated_at: new Date().toISOString() };
    if (action === 'check_in') update.last_check_in = new Date().toISOString();
    else update.last_check_out = new Date().toISOString();

    const { error } = await supabase
      .from('education_teacher_identities')
      .update(update)
      .eq('teacher_id', teacherId);

    if (error) throw new Error(error.message);
  },

  /**
   * Update content/economy stats
   */
  async updateContentStats(teacherId: string, stats: Partial<{
    content_count: number;
    revenue_earned: number;
    average_rating: number;
    total_reviews: number;
  }>): Promise<void> {
    const { data: existing } = await supabase
      .from('education_teacher_identities')
      .select('content_count, revenue_earned, total_reviews')
      .eq('teacher_id', teacherId)
      .single();

    const update = {
      content_count: (existing?.content_count || 0) + (stats.content_count || 0),
      revenue_earned: (existing?.revenue_earned || 0) + (stats.revenue_earned || 0),
      total_reviews: (existing?.total_reviews || 0) + (stats.total_reviews || 0),
      updated_at: new Date().toISOString(),
    };

    if (stats.average_rating !== undefined) {
      const total = update.total_reviews;
      update.average_rating = total > 0
        ? ((existing?.average_rating || 0) * (total - (stats.total_reviews || 0)) + stats.average_rating * (stats.total_reviews || 0)) / total
        : stats.average_rating;
    }

    const { error } = await supabase
      .from('education_teacher_identities')
      .update(update)
      .eq('teacher_id', teacherId);

    if (error) throw new Error(error.message);
  },

  /**
   * Add publication
   */
  async addPublication(teacherId: string, publication: { title: string; journal: string; year: number; url?: string }): Promise<void> {
    const { data: existing } = await supabase
      .from('education_teacher_identities')
      .select('publications')
      .eq('teacher_id', teacherId)
      .single();

    const pubs = existing?.publications || [];
    pubs.unshift(publication);

    const { error } = await supabase
      .from('education_teacher_identities')
      .update({ publications: pubs.slice(0, 50), updated_at: new Date().toISOString() })
      .eq('teacher_id', teacherId);

    if (error) throw new Error(error.message);
  },

  /**
   * Add award
   */
  async addAward(teacherId: string, award: { title: string; issuer: string; year: number; description?: string }): Promise<void> {
    const { data: existing } = await supabase
      .from('education_teacher_identities')
      .select('awards')
      .eq('teacher_id', teacherId)
      .single();

    const awards = existing?.awards || [];
    awards.unshift(award);

    const { error } = await supabase
      .from('education_teacher_identities')
      .update({ awards: awards.slice(0, 50), updated_at: new Date().toISOString() })
      .eq('teacher_id', teacherId);

    if (error) throw new Error(error.message);
  },
};
