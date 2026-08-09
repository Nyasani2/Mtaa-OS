import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface Teacher {
  id: string;
  user_id: string;
  institution_id: string;
  full_name: string;
  phone: string;
  email: string;
  id_number: string;
  kyc_status: string;
  kyc_documents: any;
  kyc_verified_at: string | null;
  kyc_verified_by: string | null;
  tsc_number: string;
  license_number: string;
  specialization: any;
  qualifications: any;
  years_experience: number;
  employment_type: string;
  subjects_taught: any;
  classes_assigned: any;
  is_class_teacher: boolean;
  class_teacher_of: string | null;
  bank_account: any;
  salary_grade: string;
  allowances: any;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherWithProfile extends Teacher {
  profile?: {
    user_id: string;
    full_name: string;
    avatar_url: string;
    email: string;
    phone: string;
  } | null;
}

export async function getTeachers(filters?: {
  institution_id?: string;
  kyc_status?: string;
  is_active?: boolean;
  employment_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.kyc_status) query = query.eq('kyc_status', filters.kyc_status);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.employment_type) query = query.eq('employment_type', filters.employment_type);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data: teachers, error } = await query;
    if (error) throw error;
    if (!teachers?.length) return { data: [] as TeacherWithProfile[], error: null };

    // Fetch profiles explicitly
    const userIds = teachers.map(t => t.user_id).filter(Boolean);
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: pData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, email, phone')
        .in('user_id', userIds);
      profiles = pData || [];
    }

    const merged = teachers.map(teacher => ({
      ...teacher,
      profile: profiles.find(p => p.user_id === teacher.user_id) || null,
    }));

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      return { data: merged.filter(t =>
        t.full_name?.toLowerCase().includes(s) ||
        t.email?.toLowerCase().includes(s) ||
        t.phone?.toLowerCase().includes(s) ||
        t.tsc_number?.toLowerCase().includes(s)
      ) as TeacherWithProfile[], error: null };
    }

    return { data: merged as TeacherWithProfile[], error: null };
  } catch (error: any) {
    console.error('getTeachers error:', error);
    return { data: [], error };
  }
}

export async function getTeacherById(id: string) {
  try {
    const { data: teacher, error } = await supabase
      .from('education_teachers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    let profile = null;
    if (teacher?.user_id) {
      const { data: pData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, email, phone')
        .eq('user_id', teacher.user_id)
        .single();
      profile = pData || null;
    }

    return { data: { ...teacher, profile } as TeacherWithProfile, error: null };
  } catch (error: any) {
    console.error('getTeacherById error:', error);
    return { data: null, error };
  }
}

export async function getTeacherByUserId(userId: string) {
  try {
    const { data: teacher, error } = await supabase
      .from('education_teachers')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return await getTeacherById(teacher.id);
  } catch (error: any) {
    console.error('getTeacherByUserId error:', error);
    return { data: null, error };
  }
}

export async function getMyTeacherProfile() {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    return await getTeacherByUserId(userId);
  } catch (error: any) {
    console.error('getMyTeacherProfile error:', error);
    return { data: null, error };
  }
}

export async function createTeacher(teacher: Partial<Teacher>) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_teachers')
      .insert([{ ...teacher, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Teacher, error: null };
  } catch (error: any) {
    console.error('createTeacher error:', error);
    return { data: null, error };
  }
}

export async function updateTeacher(id: string, updates: Partial<Teacher>) {
  try {
    const { data, error } = await supabase
      .from('education_teachers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Teacher, error: null };
  } catch (error: any) {
    console.error('updateTeacher error:', error);
    return { data: null, error };
  }
}

export async function updateTeacherKyc(id: string, status: string, verifierId?: string) {
  try {
    const updates: any = {
      kyc_status: status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'verified') {
      updates.kyc_verified_at = new Date().toISOString();
      updates.kyc_verified_by = verifierId;
    }

    const { data, error } = await supabase
      .from('education_teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Teacher, error: null };
  } catch (error: any) {
    console.error('updateTeacherKyc error:', error);
    return { data: null, error };
  }
}
