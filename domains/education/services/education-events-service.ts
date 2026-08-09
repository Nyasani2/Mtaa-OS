import { supabase } from '@/lib/supabase';

export async function getEvents(filters?: { institution_id?: string; type?: string }) {
  try {
    let q = supabase.from('education_events').select('*').order('event_date', { ascending: false });
    if (filters?.institution_id) q = q.eq('institution_id', filters.institution_id);
    if (filters?.type) q = q.eq('type', filters.type);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[EducationEvents] getEvents error:', e);
    return [];
  }
}

export async function createEvent(payload: Record<string, any>) {
  try {
    const { data, error } = await supabase.from('education_events').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[EducationEvents] createEvent error:', e);
    throw e;
  }
}
