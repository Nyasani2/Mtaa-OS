// @ts-nocheck
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface Student {
  id: string;
  user_id: string;
  institution_id: string;
  admission_number: string;
  class_level: string;
  stream: string;
  year_of_study: number;
  parent_contact: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentWithProfile extends Student {
  profile?: {
    user_id: string;
    full_name: string;
    avatar_url: string;
    email: string;
    phone: string;
  } | null;
}

export async function getStudents(filters?: {
  institution_id?: string;
  class_level?: string;
  stream?: string;
  is_active?: boolean;
  year_of_study?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_students')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.class_level) query = query.eq('class_level', filters.class_level);
    if (filters?.stream) query = query.eq('stream', filters.stream);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.year_of_study) query = query.eq('year_of_study', filters.year_of_study);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data: students, error } = await query;
    if (error) throw error;
    if (!students?.length) return { data: [] as StudentWithProfile[], error: null };

    const userIds = students.map((s: any) => s.user_id).filter(Boolean);
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: pData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, email, phone')
        .in('user_id', userIds);
      profiles = pData || [];
    }

    const merged = students.map((student: any) => ({
      ...student,
      profile: profiles.find((p: any) => p.user_id === student.user_id) || null,
    }));

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      return { data: merged.filter((st: any) =>
        st.profile?.full_name?.toLowerCase().includes(s) ||
        st.admission_number?.toLowerCase().includes(s)
      ) as StudentWithProfile[], error: null };
    }

    return { data: merged as StudentWithProfile[], error: null };
  } catch (error: any) {
    console.error('getStudents error:', error);
    return { data: [], error };
  }
}

export async function getStudentById(id: string) {
  try {
    const { data: student, error } = await supabase
      .from('education_students')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    let profile = null;
    if (student?.user_id) {
      const { data: pData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, email, phone')
        .eq('user_id', student.user_id)
        .single();
      profile = pData || null;
    }

    return { data: { ...student, profile } as StudentWithProfile, error: null };
  } catch (error: any) {
    console.error('getStudentById error:', error);
    return { data: null, error };
  }
}

export async function getStudentByUserId(userId: string) {
  try {
    const { data: student, error } = await supabase
      .from('education_students')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return await getStudentById(student.id);
  } catch (error: any) {
    console.error('getStudentByUserId error:', error);
    return { data: null, error };
  }
}

export async function getMyStudentProfile() {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    return await getStudentByUserId(userId);
  } catch (error: any) {
    console.error('getMyStudentProfile error:', error);
    return { data: null, error };
  }
}

export async function createStudent(student: Partial<Student>) {
  try {
    const { data, error } = await supabase
      .from('education_students')
      .insert([student])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Student, error: null };
  } catch (error: any) {
    console.error('createStudent error:', error);
    return { data: null, error };
  }
}

export async function updateStudent(id: string, updates: Partial<Student>) {
  try {
    const { data, error } = await supabase
      .from('education_students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Student, error: null };
  } catch (error: any) {
    console.error('updateStudent error:', error);
    return { data: null, error };
  }
}
