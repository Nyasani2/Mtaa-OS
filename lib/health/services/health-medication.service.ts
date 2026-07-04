import { supabase } from '@/lib/supabase';

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: string;
  duration: string;
  instructions: string;
  isActive: boolean;
  refillDate?: string;
  pharmacyId?: string;
  pharmacyName?: string;
  reminderTimes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  patientId: string;
  takenAt: string;
  scheduledTime: string;
  status: 'taken' | 'skipped' | 'missed';
  notes?: string;
}

const TABLE_MEDS = 'health_medications';
const TABLE_LOGS = 'health_medication_logs';

export async function getActiveMedications(patientId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from(TABLE_MEDS)
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('prescribed_date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapMedDb);
}

export async function getAllMedications(patientId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from(TABLE_MEDS)
    .select('*')
    .eq('patient_id', patientId)
    .order('prescribed_date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapMedDb);
}

export async function addMedication(med: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication | null> {
  const db = mapMedToDb({ ...med, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const { data, error } = await supabase.from(TABLE_MEDS).insert(db).select().single();
  if (error || !data) return null;
  return mapMedDb(data);
}

export async function updateMedication(medId: string, updates: Partial<Medication>): Promise<boolean> {
  const db: any = {};
  if (updates.name !== undefined) db.name = updates.name;
  if (updates.dosage !== undefined) db.dosage = updates.dosage;
  if (updates.frequency !== undefined) db.frequency = updates.frequency;
  if (updates.isActive !== undefined) db.is_active = updates.isActive;
  if (updates.reminderTimes !== undefined) db.reminder_times = updates.reminderTimes;
  db.updated_at = new Date().toISOString();
  const { error } = await supabase.from(TABLE_MEDS).update(db).eq('id', medId);
  return !error;
}

export async function logMedication(log: Omit<MedicationLog, 'id'>): Promise<MedicationLog | null> {
  const db = { ...log, id: crypto.randomUUID() };
  const { data, error } = await supabase.from(TABLE_LOGS).insert(db).select().single();
  if (error || !data) return null;
  return mapLogDb(data);
}

export async function getMedicationLogs(medicationId: string): Promise<MedicationLog[]> {
  const { data, error } = await supabase
    .from(TABLE_LOGS)
    .select('*')
    .eq('medication_id', medicationId)
    .order('taken_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapLogDb);
}

export async function getTodaysMedicationSchedule(patientId: string): Promise<{ medication: Medication; scheduledTime: string; status: string }[]> {
  const meds = await getActiveMedications(patientId);
  const today = new Date().toISOString().split('T')[0];
  const schedule: any[] = [];
  for (const med of meds) {
    for (const time of med.reminderTimes) {
      const { data } = await supabase
        .from(TABLE_LOGS)
        .select('*')
        .eq('medication_id', med.id)
        .eq('scheduled_time', time)
        .gte('taken_at', today)
        .maybeSingle();
      schedule.push({
        medication: med,
        scheduledTime: time,
        status: data?.status || 'pending',
      });
    }
  }
  return schedule;
}

function mapMedDb(row: any): Medication {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    prescribedBy: row.prescribed_by,
    prescribedDate: row.prescribed_date,
    duration: row.duration,
    instructions: row.instructions,
    isActive: row.is_active,
    refillDate: row.refill_date,
    pharmacyId: row.pharmacy_id,
    pharmacyName: row.pharmacy_name,
    reminderTimes: row.reminder_times || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedToDb(m: Medication): any {
  return {
    id: m.id,
    patient_id: m.patientId,
    name: m.name,
    dosage: m.dosage,
    frequency: m.frequency,
    prescribed_by: m.prescribedBy,
    prescribed_date: m.prescribedDate,
    duration: m.duration,
    instructions: m.instructions,
    is_active: m.isActive,
    refill_date: m.refillDate,
    pharmacy_id: m.pharmacyId,
    pharmacy_name: m.pharmacyName,
    reminder_times: m.reminderTimes,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

function mapLogDb(row: any): MedicationLog {
  return {
    id: row.id,
    medicationId: row.medication_id,
    patientId: row.patient_id,
    takenAt: row.taken_at,
    scheduledTime: row.scheduled_time,
    status: row.status,
    notes: row.notes,
  };
}
