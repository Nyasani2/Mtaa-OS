import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import * as CalendarService from './calendar-service';
import type { CalendarEvent } from './calendar-service';

export function useCalendar() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await CalendarService.getEvents(user.id, new Date().toISOString(), new Date().toISOString());
      setEvents(data);
    } catch (e: any) {
      console.error('[useCalendar] fetchEvents error:', e);
      setError(e?.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchEventsForDate = useCallback(async (date: string) => {
    if (!user?.id) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await CalendarService.getEventsForDate(user.id, date);
      setEvents(data);
      return data;
    } catch (e: any) {
      console.error('[useCalendar] fetchEventsForDate error:', e);
      setError(e?.message || 'Failed to load events');
      setEvents([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
    fetchEventsForDate,
    createEvent: CalendarService.createEvent,
    updateEvent: CalendarService.updateEvent,
    deleteEvent: CalendarService.deleteEvent,
  };
}

export type { CalendarEvent };
