// lib/services/calendar-service.ts
// MTAA Calendar Service — CRUD for events and reminders

import { supabase } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  is_all_day: boolean;
  timezone: string;
  category: EventCategory;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_end_date?: string;
  recurrence_days?: number[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  updated_at: string;
}

export interface CalendarReminder {
  id: string;
  event_id: string;
  user_id: string;
  minutes_before: number;
  reminder_type: 'notification' | 'email' | 'sms' | 'push';
  is_triggered: boolean;
  triggered_at?: string;
  created_at: string;
}

export type EventCategory = 
  | 'work' | 'personal' | 'health' | 'finance' | 'education' 
  | 'social' | 'transport' | 'civic' | 'family' | 'other';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Work', color: '#3b82f6' },
  { value: 'personal', label: 'Personal', color: '#8b5cf6' },
  { value: 'health', label: 'Health', color: '#ef4444' },
  { value: 'finance', label: 'Finance', color: '#10b981' },
  { value: 'education', label: 'Education', color: '#f59e0b' },
  { value: 'social', label: 'Social', color: '#ec4899' },
  { value: 'transport', label: 'Transport', color: '#06b6d4' },
  { value: 'civic', label: 'Civic', color: '#1e3a5f' },
  { value: 'family', label: 'Family', color: '#f97316' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

export const REMINDER_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 10080, label: '1 week before' },
];

/* ─── CRUD Operations ─── */

export async function getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    
    .order('start_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[calendar-service] getEvents error:', error);
    return [];
  }
  return data || [];
}

export async function getEventsForDate(date: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('start_date', date)
    
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[calendar-service] getEventsForDate error:', error);
    return [];
  }
  return data || [];
}

export async function createEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent | null> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[calendar-service] createEvent error:', error);
    return null;
  }
  return data;
}

export async function updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[calendar-service] updateEvent error:', error);
    return null;
  }
  return data;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[calendar-service] deleteEvent error:', error);
    return false;
  }
  return true;
}

/* ─── Reminders ─── */

export async function createReminder(reminder: Omit<CalendarReminder, 'id' | 'created_at'>): Promise<CalendarReminder | null> {
  const { data, error } = await supabase
    .from('calendar_reminders')
    .insert(reminder)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[calendar-service] createReminder error:', error);
    return null;
  }
  return data;
}

export async function getRemindersForEvent(eventId: string): Promise<CalendarReminder[]> {
  const { data, error } = await supabase
    .from('calendar_reminders')
    .select('*')
    .eq('event_id', eventId)
    .order('minutes_before', { ascending: true });

  if (error) {
    console.error('[calendar-service] getRemindersForEvent error:', error);
    return [];
  }
  return data || [];
}

export async function deleteReminder(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('calendar_reminders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[calendar-service] deleteReminder error:', error);
    return false;
  }
  return true;
}

/* ─── Search ─── */

export async function searchEvents(query: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .textSearch('search_vector', query)
    
    .order('start_date', { ascending: true })
    .limit(20);

  if (error) {
    console.error('[calendar-service] searchEvents error:', error);
    return [];
  }
  return data || [];
}
