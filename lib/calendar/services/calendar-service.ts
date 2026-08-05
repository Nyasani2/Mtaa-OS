import { supabase } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  is_all_day?: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

export async function getEvents(userId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[CalendarService] getEvents error:', error);
    throw error;
  }
  return (data || []).map(normalizeEvent);
}

export async function getEventsForDate(userId: string, date: string): Promise<CalendarEvent[]> {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', startOfDay)
    .lte('start_date', endOfDay)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[CalendarService] getEventsForDate error:', error);
    throw error;
  }
  return (data || []).map(normalizeEvent);
}

export async function createEvent(
  userId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: userId,
      title: event.title || 'Untitled',
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      is_all_day: event.is_all_day ?? false,
      color: event.color || '#2563eb',
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[CalendarService] createEvent error:', error);
    throw error;
  }
  return normalizeEvent(data);
}

export async function updateEvent(
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[CalendarService] updateEvent error:', error);
    throw error;
  }
  return normalizeEvent(data);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('[CalendarService] deleteEvent error:', error);
    throw error;
  }
}

// ─── Normalize ──────────────────────────────────────────────
function normalizeEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || 'Untitled',
    description: row.description,
    start_date: row.start_date,
    end_date: row.end_date,
    location: row.location,
    is_all_day: row.is_all_day ?? false,
    color: row.color || '#2563eb',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
