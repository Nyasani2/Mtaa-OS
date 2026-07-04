import { useState, useEffect, useCallback } from "react";
import { AppointmentService, HealthAppointment } from "../services/appointment.service";

export function useAppointments(userId?: string) {
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [upcoming, setUpcoming] = useState<HealthAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setAppointments([]);
      setUpcoming([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [all, up] = await Promise.all([
        AppointmentService.getAppointments(userId),
        AppointmentService.getUpcomingAppointments(userId),
      ]);
      setAppointments(all);
      setUpcoming(up);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const book = useCallback(async (data: Omit<HealthAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const a = await AppointmentService.book(data);
      if (a) await load();
      return a;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [load]);

  const cancel = useCallback(async (appointmentId: string, reason?: string) => {
    setLoading(true);
    try {
      const ok = await AppointmentService.cancel(appointmentId, reason);
      if (ok) await load();
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [load]);

  const reschedule = useCallback(async (appointmentId: string, newDate: string, newTime: string) => {
    setLoading(true);
    try {
      const ok = await AppointmentService.reschedule(appointmentId, newDate, newTime);
      if (ok) await load();
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [load]);

  const complete = useCallback(async (appointmentId: string) => {
    const ok = await AppointmentService.complete(appointmentId);
    if (ok) await load();
    return ok;
  }, [load]);

  const getAvailability = useCallback(async (doctorId: string, date: string) => {
    return AppointmentService.getDoctorAvailability(doctorId, date);
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
