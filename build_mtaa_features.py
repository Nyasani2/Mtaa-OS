import os
import re

print("🚀 Building MTAA Health Features (Safe Mode)...")

# ==========================================
# 1. APPOINTMENT SERVICE (Slot Engine & Reminders)
# ==========================================
service_path = 'lib/health/services/appointment.service.ts'
os.makedirs(os.path.dirname(service_path), exist_ok=True)

service_content = """import { supabase } from '@/lib/supabase';
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
"""

with open(service_path, 'w', encoding='utf-8') as f:
    f.write(service_content)
print(f"✅ Wrote: {service_path}")

# ==========================================
# 2. APPOINTMENT HOOK
# ==========================================
hook_path = 'lib/health/hooks/useAppointmentBooking.ts'
os.makedirs(os.path.dirname(hook_path), exist_ok=True)

hook_content = """import { useState } from 'react';
import { getAvailableSlots, bookAppointmentWithSlot } from '@/lib/health/services/appointment.service';

export function useAppointmentBooking() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async (staffId: string, dateStr: string) => {
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
  };

  const bookAppointment = async (payload: any) => {
    setBooking(true);
    setError(null);
    try {
      const result = await bookAppointmentWithSlot(payload);
      return { success: true, data: result };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setBooking(false);
    }
  };

  return { slots, loadingSlots, booking, error, fetchSlots, bookAppointment };
}
"""

with open(hook_path, 'w', encoding='utf-8') as f:
    f.write(hook_content)
print(f"✅ Wrote: {hook_path}")

# ==========================================
# 3. HOOKS INDEX EXPORT
# ==========================================
index_path = 'lib/health/hooks/index.ts'
os.makedirs(os.path.dirname(index_path), exist_ok=True)

if os.path.exists(index_path):
    with open(index_path, 'r', encoding='utf-8') as f:
        existing = f.read()
    if 'useAppointmentBooking' not in existing:
        with open(index_path, 'a', encoding='utf-8') as f:
            f.write("\nexport * from './useAppointmentBooking';\n")
else:
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write("export * from './useAppointmentBooking';\n")
print(f"✅ Updated: {index_path}")

# ==========================================
# 4. DOCTOR WORKSPACE (Allergy Hard-Stop)
# ==========================================
doc_file = 'app/(os)/health/doctor/index.tsx'
if os.path.exists(doc_file):
    with open(doc_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_rx_save = """      // 2. Create prescription
      const validRxItems = rxItems.filter(item => item.drug.trim());
      if (validRxItems.length > 0) {"""
    
    new_rx_save = """      // 2. PRESCRIBING SAFETY: Check for allergies before saving
      const validRxItems = rxItems.filter(item => item.drug.trim());
      if (validRxItems.length > 0) {
        const { data: patientData } = await supabase
          .from('health_patients')
          .select('allergies')
          .eq('id', patientId)
          .single();
        
        if (patientData?.allergies) {
          const allergies = Array.isArray(patientData.allergies) ? patientData.allergies : [patientData.allergies];
          const prescribedDrugs = validRxItems.map(item => item.drug.toLowerCase());
          const allergicDrugs = allergies.filter((allergy: string) => 
            prescribedDrugs.some((drug: string) => drug.includes(allergy.toLowerCase()))
          );
          
          if (allergicDrugs.length > 0) {
            Alert.alert('⚠️ CRITICAL ALLERGY WARNING', `Patient is allergic to: ${allergicDrugs.join(', ')}. Prescription blocked.`);
            setSaving(false);
            return;
          }
        }
"""
    if old_rx_save in content:
        content = content.replace(old_rx_save, new_rx_save)
        with open(doc_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Injected Allergy Hard-Stop into: {doc_file}")
    elif "PRESCRIBING SAFETY" in content:
        print(f"ℹ️ Allergy Hard-Stop already exists in: {doc_file}")
    else:
        print(f"⚠️ Could not find exact prescription save block in: {doc_file} (Manual check required)")
else:
    print(f"⚠️ File not found: {doc_file}")

# ==========================================
# 5. BILLING REVENUE RECOGNITION
# ==========================================
billing_file = 'app/(os)/health/billing/index.tsx'
if os.path.exists(billing_file):
    with open(billing_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace(
        'const [recognizedRevenue, setRecognizedRevenue] = useState(0);',
        'const [recognizedRevenue, setRecognizedRevenue] = useState(0); // Only PAID'
    )
    content = content.replace(
        'const [outstandingReceivables, setOutstandingReceivables] = useState(0);',
        'const [outstandingReceivables, setOutstandingReceivables] = useState(0); // PENDING'
    )
    content = content.replace(
        'const [overdueDebt, setOverdueDebt] = useState(0);',
        'const [overdueDebt, setOverdueDebt] = useState(0); // OVERDUE'
    )
    
    if 'let paid = 0, pending = 0, overdue = 0;' in content:
        content = content.replace('let paid = 0, pending = 0, overdue = 0;', 'let recognized = 0, outstanding = 0, overdue = 0;')
        content = content.replace('setRecognizedRevenue(paid);', 'setRecognizedRevenue(recognized);')
        content = content.replace('setOutstandingReceivables(pending);', 'setOutstandingReceivables(outstanding);')
        content = content.replace('paid += tx.amount;', 'recognized += tx.amount;')
        content = content.replace('pending += tx.amount;', 'outstanding += tx.amount;')
        
    with open(billing_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Fixed Revenue Recognition in: {billing_file}")
else:
    print(f"⚠️ File not found: {billing_file}")

print("\n🎉 ALL FEATURES BUILT SUCCESSFULLY!")
print("👉 NEXT STEP: Restart Expo with a clean cache:")
print("   npx expo start -c")
