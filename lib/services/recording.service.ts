import { supabase } from '@/lib/supabase';

export interface Recording {
  id: string;
  device_id: string;
  recording_type: string;
  storage_path: string;
  thumbnail_path?: string;
  duration_seconds: number;
  file_size_bytes?: number;
  resolution?: string;
  frame_rate?: number;
  has_audio: boolean;
  encrypted: boolean;
  checksum?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  avg_speed_kmh?: number;
  max_speed_kmh?: number;
  heading?: number;
  vehicle_id?: string;
  driver_id?: string;
  trip_id?: string;
  boda_trip_id?: string;
  mtaxi_trip_id?: string;
  freight_request_id?: string;
  started_at: string;
  ended_at?: string;
  timezone: string;
  odometer_km?: number;
  metadata: any;
  upload_status: string;
  processing_status: string;
  retention_until?: string;
  created_at: string;
  updated_at: string;
}

export async function startRecording(recording: Omit<Recording, 'id' | 'created_at' | 'updated_at' | 'ended_at'>) {
  const { data, error } = await supabase
    .from('recordings')
    .insert(recording)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function stopRecording(recordingId: string, endData: { ended_at: string; end_lat?: number; end_lng?: number; duration_seconds: number; file_size_bytes?: number }) {
  const { data, error } = await supabase
    .from('recordings')
    .update({
      ...endData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecordings(filters?: {
  device_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  recording_type?: string;
  upload_status?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('recordings').select('*').order('started_at', { ascending: false });
  if (filters?.device_id) query = query.eq('device_id', filters.device_id);
  if (filters?.driver_id) query = query.eq('driver_id', filters.driver_id);
  if (filters?.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
  if (filters?.recording_type) query = query.eq('recording_type', filters.recording_type);
  if (filters?.upload_status) query = query.eq('upload_status', filters.upload_status);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRecordingById(id: string) {
  const { data, error } = await supabase
    .from('recordings')
    .select(`
      *,
      device:device_id(*),
      vehicle:vehicle_id(*),
      driver:driver_id(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRecordingUploadStatus(id: string, status: string, storagePath?: string) {
  const updates: any = { upload_status: status, updated_at: new Date().toISOString() };
  if (storagePath) updates.storage_path = storagePath;
  const { data, error } = await supabase
    .from('recordings')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecordingsByTrip(tripId: string) {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('trip_id', tripId)
    .order('started_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getRecordingsByDateRange(startDate: string, endDate: string, driverId?: string) {
  let query = supabase
    .from('recordings')
    .select('*')
    .gte('started_at', startDate)
    .lte('started_at', endDate)
    .order('started_at', { ascending: false });
  if (driverId) query = query.eq('driver_id', driverId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function deleteRecording(id: string) {
  // Check if recording has locked evidence first
  const { data: lockedEvidence } = await supabase
    .from('evidence')
    .select('id')
    .eq('recording_id', id)
    .eq('is_locked', true)
    .maybeSingle();

  if (lockedEvidence) {
    throw new Error('Cannot delete recording with locked evidence');
  }

  const { error } = await supabase.from('recordings').delete().eq('id', id);
  if (error) throw error;
}

export async function getStorageStats(driverId?: string) {
  let query = supabase.from('recordings').select('file_size_bytes');
  if (driverId) query = query.eq('driver_id', driverId);
  const { data, error } = await query;
  if (error) throw error;
  const totalBytes = (data || []).reduce((sum: number, r: any) => sum + (r.file_size_bytes || 0), 0);
  return {
    totalBytes,
    totalGB: Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100,
    count: (data || []).length,
  };
}
