import { supabase } from '@/lib/supabase';

export interface TimetableEntry {
  id: string;
  institution_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getTimetable(filters: {
  institution_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_timetable')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as TimetableEntry[], error: null };
  } catch (error: any) {
    console.error('getTimetable error:', error);
    return { data: [], error };
  }
}

export async function getTimetableById(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_timetable')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: data as TimetableEntry, error: null };
  } catch (error: any) {
    console.error('getTimetableById error:', error);
    return { data: null, error };
  }
}

export async function createTimetableEntry(entry: Partial<TimetableEntry>) {
  try {
    const { data, error } = await supabase
      .from('education_timetable')
      .insert([entry])
      .select()
      .single();
    if (error) throw error;
    return { data: data as TimetableEntry, error: null };
  } catch (error: any) {
    console.error('createTimetableEntry error:', error);
    return { data: null, error };
  }
}

export async function updateTimetableEntry(id: string, updates: Partial<TimetableEntry>) {
  try {
    const { data, error } = await supabase
      .from('education_timetable')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as TimetableEntry, error: null };
  } catch (error: any) {
    console.error('updateTimetableEntry error:', error);
    return { data: null, error };
  }
}

export async function deleteTimetableEntry(id: string) {
  try {
    const { error } = await supabase
      .from('education_timetable')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('deleteTimetableEntry error:', error);
    return { success: false, error };
  }
}
