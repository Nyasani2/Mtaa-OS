import { useState, useCallback } from 'react';
import { getAvailableSlots, bookAppointmentWithSlot } from '../services/appointment.service';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function useAppointmentBooking() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (staffId: string, dateStr: string) => {
    setLoadingSlots(true);
    setError(null);
    try {
      const available = await getAvailableSlots(staffId, dateStr);
      setSlots(available);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const bookAppointment = useCallback(async (payload: any) => {
    setBooking(true);
    setError(null);
    try {
      const appt = await bookAppointmentWithSlot(payload);
      if (Platform.OS !== 'web') {
        const apptDate = new Date(`${payload.scheduled_date}T${payload.scheduled_time}`);
        const reminderTime = apptDate.getTime() - (60 * 60 * 1000);
        if (reminderTime > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: { title: 'Upcoming Appointment', body: `You have an appointment in 1 hour.` },
            trigger: { date: new Date(reminderTime) } as any,
          });
        }
      }
      return { success: true, data: appt };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setBooking(false);
    }
  }, []);

  return { slots, loadingSlots, booking, error, fetchSlots, bookAppointment };
}
