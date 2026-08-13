// @ts-nocheck
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface Announcement {
  id: string;
  staff_id: string;
  institution_id: string;
  title: string;
  content: string;
  media_url: string;
  media_type: string;
  priority: string;
  is_pinned: boolean;
  visibility_scope: string;
  target_roles: string[];
  expiry_date: string;
  read_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithAuthor extends Announcement {
  author?: {
    user_id: string;
    full_name: string;
    avatar_url: string;
    role: string;
  } | null;
}

export async function getAnnouncements(filters?: {
  institution_id?: string;
  priority?: string;
  visibility_scope?: string;
  is_pinned?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.visibility_scope) query = query.eq('visibility_scope', filters.visibility_scope);
    if (filters?.is_pinned !== undefined) query = query.eq('is_pinned', filters.is_pinned);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data: announcements, error } = await query;
    if (error) throw error;
    if (!announcements?.length) return { data: [] as AnnouncementWithAuthor[], error: null };

    // Fetch staff authors
    const staffIds = announcements.map((a: any) => a.staff_id).filter(Boolean);
    let staffList: any[] = [];
    if (staffIds.length > 0) {
      const { data: sData } = await supabase
        .from('education_staff')
        .select('id, user_id, role')
        .in('id', staffIds);
      staffList = sData || [];
    }

    // Fetch staff profiles
    const staffUserIds = staffList.map((s: any) => s.user_id).filter(Boolean);
    let staffProfiles: any[] = [];
    if (staffUserIds.length > 0) {
      const { data: spData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', staffUserIds);
      staffProfiles = spData || [];
    }

    const merged = announcements.map((ann: any) => {
      const staff = staffList.find((s: any) => s.id === ann.staff_id);
      const profile = staffProfiles.find((p: any) => p.user_id === staff?.user_id);
      return {
        ...ann,
        author: profile ? { ...profile, role: staff?.role || 'staff' } : null,
      };
    });

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      return { data: merged.filter((a: any) =>
        a.title?.toLowerCase().includes(s) ||
        a.content?.toLowerCase().includes(s)
      ) as AnnouncementWithAuthor[], error: null };
    }

    return { data: merged as AnnouncementWithAuthor[], error: null };
  } catch (error: any) {
    console.error('getAnnouncements error:', error);
    return { data: [], error };
  }
}

export async function getAnnouncementById(id: string) {
  try {
    const { data: ann, error } = await supabase
      .from('education_announcements')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    let author = null;
    if (ann?.staff_id) {
      const { data: staff } = await supabase
        .from('education_staff')
        .select('id, user_id, role')
        .eq('id', ann.staff_id)
        .single();
      if (staff?.user_id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', staff.user_id)
          .single();
        author = profile ? { ...profile, role: staff.role } : null;
      }
    }

    return { data: { ...ann, author } as AnnouncementWithAuthor, error: null };
  } catch (error: any) {
    console.error('getAnnouncementById error:', error);
    return { data: null, error };
  }
}

export async function createAnnouncement(announcement: Partial<Announcement>) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: staff } = await supabase
      .from('education_staff')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('education_announcements')
      .insert([{ ...announcement, staff_id: staff?.id }])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Announcement, error: null };
  } catch (error: any) {
    console.error('createAnnouncement error:', error);
    return { data: null, error };
  }
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>) {
  try {
    const { data, error } = await supabase
      .from('education_announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Announcement, error: null };
  } catch (error: any) {
    console.error('updateAnnouncement error:', error);
    return { data: null, error };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const { error } = await supabase
      .from('education_announcements')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('deleteAnnouncement error:', error);
    return { success: false, error };
  }
}
