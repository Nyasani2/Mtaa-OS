import { supabase } from '@/lib/supabase';

export type ParticipantRole = 'student' | 'teacher' | 'head_teacher' | 'staff' | 'admin' | 'parent' | 'accountant';

export interface Participant {
  id: string;
  user_id: string | null;
  institution_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  role: ParticipantRole;
  detail_1: string | null;
  detail_2: string | null;
  detail_3: string | null;
  created_at: string;
  updated_at: string;
  profile?: any;
}

// ── GET all participants (unified view) ──
export async function getParticipants(filters?: {
  institution_id?: string;
  role?: ParticipantRole;
  is_active?: boolean;
  search?: string;
}) {
  try {
    let q = supabase.from('education_participants').select('*').order('created_at', { ascending: false });
    if (filters?.institution_id) q = q.eq('institution_id', filters.institution_id);
    if (filters?.role) q = q.eq('role', filters.role);
    if (filters?.is_active !== undefined) q = q.eq('is_active', filters.is_active);
    if (filters?.search) q = q.ilike('full_name', `%${filters.search}%`);

    const { data, error } = await q;
    if (error) throw error;

    const participants = (data || []) as Participant[];
    if (!participants.length) return [];

    // Fetch profiles for all user_ids
    const userIds = participants.map((p) => p.user_id).filter(Boolean) as string[];
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: p } = await supabase.from('user_profiles').select('*').in('user_id', userIds);
      profiles = p || [];
    }

    return participants.map((p) => ({
      ...p,
      profile: profiles.find((pr: any) => pr.user_id === p.user_id) || null,
    }));
  } catch (e) {
    console.error('[Participants] getParticipants error:', e);
    return [];
  }
}

// ── GET participant count by role ──
export async function getParticipantCounts(institutionId?: string) {
  try {
    const all = await getParticipants(institutionId ? { institution_id: institutionId } : undefined);
    const counts: Record<string, number> = {};
    all.forEach((p) => {
      counts[p.role] = (counts[p.role] || 0) + 1;
    });
    return counts;
  } catch (e) {
    console.error('[Participants] getParticipantCounts error:', e);
    return {};
  }
}

// ── GET single participant by ID + role ──
export async function getParticipantById(id: string, role: ParticipantRole) {
  try {
    const table = roleToTable(role);
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[Participants] getParticipantById error:', e);
    return null;
  }
}

// ── CREATE participant by role ──
export async function createParticipant(role: ParticipantRole, payload: Record<string, any>) {
  try {
    const table = roleToTable(role);
    const insertPayload = normalizePayload(role, payload);
    const { data, error } = await supabase.from(table).insert(insertPayload).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[Participants] createParticipant error:', e);
    throw e;
  }
}

// ── UPDATE participant by role ──
export async function updateParticipant(id: string, role: ParticipantRole, payload: Record<string, any>) {
  try {
    const table = roleToTable(role);
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[Participants] updateParticipant error:', e);
    throw e;
  }
}

// ── DELETE participant by role ──
export async function deleteParticipant(id: string, role: ParticipantRole) {
  try {
    const table = roleToTable(role);
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('[Participants] deleteParticipant error:', e);
    throw e;
  }
}

// ── GET students by parent ──
export async function getStudentsByParent(parentId: string) {
  try {
    const { data: parent, error } = await supabase.from('education_parents').select('children_ids').eq('id', parentId).single();
    if (error || !parent?.children_ids?.length) return [];
    const { data } = await supabase.from('education_students').select('*').in('id', parent.children_ids);
    return data || [];
  } catch (e) {
    console.error('[Participants] getStudentsByParent error:', e);
    return [];
  }
}

// ── GET teachers by institution ──
export async function getTeachersByInstitution(institutionId: string) {
  try {
    const { data, error } = await supabase.from('education_teachers').select('*').eq('institution_id', institutionId);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[Participants] getTeachersByInstitution error:', e);
    return [];
  }
}

// ── GET head teachers ──
export async function getHeadTeachers(filters?: { institution_id?: string }) {
  try {
    let q = supabase.from('education_teachers').select('*').eq('is_head_teacher', true);
    if (filters?.institution_id) q = q.eq('institution_id', filters.institution_id);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[Participants] getHeadTeachers error:', e);
    return [];
  }
}

// ── Helpers ──
function roleToTable(role: ParticipantRole): string {
  switch (role) {
    case 'student': return 'education_students';
    case 'teacher':
    case 'head_teacher': return 'education_teachers';
    case 'staff': return 'education_staff';
    case 'admin': return 'education_school_admins';
    case 'parent': return 'education_parents';
    case 'accountant': return 'education_accountants';
    default: return 'education_staff';
  }
}

function normalizePayload(role: ParticipantRole, payload: Record<string, any>): Record<string, any> {
  const base = { ...payload };
  if (role === 'head_teacher') {
    base.is_head_teacher = true;
    base.role = 'teacher';
  }
  return base;
}
