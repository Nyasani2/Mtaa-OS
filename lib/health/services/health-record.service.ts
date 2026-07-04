import { supabase } from '@/lib/supabase';
import { HealthRecordMetadata, TimelineEntry, HealthRecordType } from '../types';
import { storeRecord, getRecord, listRecords, deleteRecord, getVaultStats, HealthRecord } from '../security/health-vault';

const TABLE_METADATA = 'health_record_metadata';

export async function syncRecordToCloud(record: HealthRecord): Promise<boolean> {
  const meta = {
    id: record.id,
    patient_id: record.data?.patientId,
    record_type: record.type,
    hospital_id: record.hospitalId,
    hospital_name: record.hospitalName,
    doctor_id: record.doctorId,
    doctor_name: record.doctorName,
    date: record.date,
    title: record.title,
    summary: record.data?.summary || record.title,
    signature: record.signature,
    checksum: record.checksum,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
  const { error } = await supabase.from(TABLE_METADATA).upsert(meta);
  return !error;
}

export async function getCloudMetadata(patientId: string): Promise<HealthRecordMetadata[]> {
  const { data, error } = await supabase
    .from(TABLE_METADATA)
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbToMetadata);
}

export async function getTimeline(patientId: string): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from(TABLE_METADATA)
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    date: row.date,
    type: row.record_type as HealthRecordType,
    title: row.title,
    subtitle: row.summary || '',
    hospitalName: row.hospital_name,
    doctorName: row.doctor_name,
    status: row.status || 'normal',
    isVerified: !!row.signature,
  }));
}

export async function searchRecords(patientId: string, query: string): Promise<HealthRecordMetadata[]> {
  const { data, error } = await supabase
    .from(TABLE_METADATA)
    .select('*')
    .eq('patient_id', patientId)
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,hospital_name.ilike.%${query}%,doctor_name.ilike.%${query}%`)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbToMetadata);
}

export async function getRecordsByType(patientId: string, type: HealthRecordType): Promise<HealthRecordMetadata[]> {
  const { data, error } = await supabase
    .from(TABLE_METADATA)
    .select('*')
    .eq('patient_id', patientId)
    .eq('record_type', type)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapDbToMetadata);
}

export async function deleteRecordCompletely(recordId: string): Promise<boolean> {
  await deleteRecord(recordId);
  const { error } = await supabase.from(TABLE_METADATA).delete().eq('id', recordId);
  return !error;
}

function mapDbToMetadata(row: any): HealthRecordMetadata {
  return {
    id: row.id,
    type: row.record_type,
    patientId: row.patient_id,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    date: row.date,
    title: row.title,
    summary: row.summary || '',
    signature: row.signature,
    checksum: row.checksum,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export { storeRecord, getRecord, listRecords, deleteRecord, getVaultStats };
