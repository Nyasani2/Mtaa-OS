import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

// --- SLOT ENGINE & REMINDERS ---

export async function getAvailableSlots(staffId: string, dateStr: string, durationMins: number = 30) {
  const startHour = 8;
  const endHour = 17;
  
  const { data: booked, error } = await supabase
    .from('health_appointments')
    .select('scheduled_time')
    .eq('staff_id', staffId)
    .eq('scheduled_date', dateStr)
    .neq('status', 'cancelled');

  const bookedTimes = booked?.map(b => b.scheduled_time) || [];
  const slots = [];

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += durationMins) {
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
      if (!bookedTimes.includes(timeStr)) {
        slots.push({ time: timeStr, available: true });
      }
    }
  }
  return slots;
}

export async function bookAppointmentWithSlot(payload: any) {
  const { data: existing } = await supabase
    .from('health_appointments')
    .select('id')
    .eq('staff_id', payload.staff_id)
    .eq('scheduled_date', payload.scheduled_date)
    .eq('scheduled_time', payload.scheduled_time)
    .neq('status', 'cancelled');

  if (existing && existing.length > 0) {
    throw new Error('This slot was just booked by someone else. Please choose another.');
  }

  const { data, error } = await supabase
    .from('health_appointments')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  try {
    const apptDate = new Date(`${payload.scheduled_date}T${payload.scheduled_time}`);
    const reminderTime = new Date(apptDate.getTime() - 60 * 60 * 1000);
    
    if (reminderTime.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upcoming Appointment",
          body: `You have an appointment in 1 hour.`,
        },
        trigger: { date: reminderTime },
      });
    }
  } catch (e) {
    console.log('Notification scheduling failed', e);
  }

  return data;
}
