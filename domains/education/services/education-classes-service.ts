// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface Class {
  id: string;
  institution_id: string;
  name: string;
  level: string;
  stream: string;
  room: string;
  capacity: number;
  timetable: any;
  is_active: boolean;
  academic_year: string;
  created_at: string;
  updated_at: string;
  class_teacher_id: string | null;
}

export interface ClassWithTeacher extends Class {
  teacher?: {
    id: string;
    user_id: string;
    full_name: string;
    profile?: {
      full_name: string;
      avatar_url: string;
    } | null;
  } | null;
  student_count?: number;
}

export async function getClasses(filters?: {
  institution_id?: string;
  level?: string;
  stream?: string;
  is_active?: boolean;
  academic_year?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_classes')
      .select('*')
      .order('level', { ascending: true });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.level) query = query.eq('level', filters.level);
    if (filters?.stream) query = query.eq('stream', filters.stream);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.academic_year) query = query.eq('academic_year', filters.academic_year);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data: classes, error } = await query;
    if (error) throw error;
    if (!classes?.length) return { data: [] as ClassWithTeacher[], error: null };

    // Fetch teachers
    const teacherIds = classes.map((c: any) => c.class_teacher_id).filter(Boolean);
    let teachers: any[] = [];
    if (teacherIds.length > 0) {
      const { data: tData } = await supabase
        .from('education_teachers')
        .select('id, user_id, full_name')
        .in('id', teacherIds);
      teachers = tData || [];
    }

    // Fetch teacher profiles
    const teacherUserIds = teachers.map((t: any) => t.user_id).filter(Boolean);
    let teacherProfiles: any[] = [];
    if (teacherUserIds.length > 0) {
      const { data: tpData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', teacherUserIds);
      teacherProfiles = tpData || [];
    }

    const merged = classes.map((cls: any) => {
      const teacher = teachers.find((t: any) => t.id === cls.class_teacher_id);
      const profile = teacherProfiles.find((p: any) => p.user_id === teacher?.user_id);
      return {
        ...cls,
        teacher: teacher ? { ...teacher, profile: profile || null } : null,
      };
    });

    return { data: merged as ClassWithTeacher[], error: null };
  } catch (error: any) {
    console.error('getClasses error:', error);
    return { data: [], error };
  }
}

export async function getClassById(id: string) {
  try {
    const { data: cls, error } = await supabase
      .from('education_classes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    let teacher = null;
    if (cls?.class_teacher_id) {
      const { data: tData } = await supabase
        .from('education_teachers')
        .select('id, user_id, full_name')
        .eq('id', cls.class_teacher_id)
        .single();
      if (tData?.user_id) {
        const { data: pData } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', tData.user_id)
          .single();
        teacher = { ...tData, profile: pData || null };
      } else {
        teacher = { ...tData, profile: null };
      }
    }

    return { data: { ...cls, teacher } as ClassWithTeacher, error: null };
  } catch (error: any) {
    console.error('getClassById error:', error);
    return { data: null, error };
  }
}

export async function createClass(cls: Partial<Class>) {
  try {
    const { data, error } = await supabase
      .from('education_classes')
      .insert([cls])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Class, error: null };
  } catch (error: any) {
    console.error('createClass error:', error);
    return { data: null, error };
  }
}

export async function updateClass(id: string, updates: Partial<Class>) {
  try {
    const { data, error } = await supabase
      .from('education_classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Class, error: null };
  } catch (error: any) {
    console.error('updateClass error:', error);
    return { data: null, error };
  }
}

export async function getClassStudents(classId: string) {
  try {
    const { data, error } = await supabase
      .from('education_students')
      .select('*')
      .eq('class_level', classId)  // Note: schema uses class_level, not class_id
      .eq('is_active', true)
      .order('admission_number', { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('getClassStudents error:', error);
    return { data: null, error };
  }
}
