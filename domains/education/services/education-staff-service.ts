import { supabase } from '@/lib/supabase';

export async function getStaff(filters?: { institution_id?: string; role?: string }) {
  try {
    let q = supabase.from('education_staff').select('*').order('created_at', { ascending: false });
    if (filters?.institution_id) q = q.eq('institution_id', filters.institution_id);
    if (filters?.role) q = q.eq('role', filters.role);
    const { data: staff, error } = await q;
    if (error) throw error;
    if (!staff?.length) return [];

    const userIds = staff.map((s: any) => s.user_id).filter(Boolean);
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: p } = await supabase.from('user_profiles').select('*').in('user_id', userIds);
      profiles = p || [];
    }

    return staff.map((s: any) => ({
      ...s,
      profile: profiles.find((p: any) => p.user_id === s.user_id) || null,
    }));
  } catch (e) {
    console.error('[EducationStaff] getStaff error:', e);
    return [];
  }
}

export async function createStaff(payload: Record<string, any>) {
  try {
    const { data, error } = await supabase.from('education_staff').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[EducationStaff] createStaff error:', e);
    throw e;
  }
}
