import { useState, useEffect, useCallback } from 'react';
import {
  getAppointments,
  getUpcomingAppointments,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  markAppointmentCompleted,
  getDoctorAvailability,
  HealthAppointment,
} from '../services/health-appointment.service';

export function useHealthAppointments(patientId: string) {
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [upcoming, setUpcoming] = useState<HealthAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) load();
  }, [patientId]);

  async function load() {
    setLoading(true);
    try {
      const [all, up] = await Promise.all([
        getAppointments(patientId),
        getUpcomingAppointments(patientId),
      ]);
      setAppointments(all);
      setUpcoming(up);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const book = useCallback(async (appointment: Omit<HealthAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const a = await bookAppointment(appointment);
      if (a) await load();
      return a;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const cancel = useCallback(async (appointmentId: string, reason?: string) => {
    setLoading(true);
    try {
      const ok = await cancelAppointment(appointmentId, reason);
      if (ok) await load();
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reschedule = useCallback(async (appointmentId: string, newDate: string, newTime: string) => {
    setLoading(true);
    try {
      const ok = await rescheduleAppointment(appointmentId, newDate, newTime);
      if (ok) await load();
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const complete = useCallback(async (appointmentId: string) => {
    const ok = await markAppointmentCompleted(appointmentId);
    if (ok) await load();
    return ok;
  }, []);

  const getAvailability = useCallback(async (doctorId: string, date: string) => {
    return getDoctorAvailability(doctorId, date);
  }, []);

  return {
    appointments,
    upcoming,
    loading,
    error,
    refresh: load,
    book,
    cancel,
    reschedule,
    complete,
    getAvailability,
  };
}
