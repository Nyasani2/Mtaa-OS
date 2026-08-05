import { supabase } from '@/lib/supabase';

export interface Device {
  id: string;
  device_id: string;
  name: string;
  device_type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  firmware_version?: string;
  connection_type: string;
  status: string;
  battery_level?: number;
  storage_remaining_gb?: number;
  storage_total_gb?: number;
  signal_strength?: number;
  connection_quality?: string;
  last_sync_at?: string;
  gps_available: boolean;
  camera_health: string;
  resolution_preference: string;
  frame_rate: number;
  audio_enabled: boolean;
  microphone_enabled: boolean;
  auto_upload: boolean;
  wifi_only_upload: boolean;
  encryption_enabled: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface DeviceAssignment {
  id: string;
  device_id: string;
  assigned_type: string;
  assigned_vehicle_id?: string;
  assigned_user_id?: string;
  assigned_by?: string;
  assigned_at: string;
  unassigned_at?: string;
  notes?: string;
  is_primary: boolean;
}

export async function registerDevice(deviceData: Omit<Device, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('devices')
    .insert(deviceData)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDevices(filters?: { status?: string; device_type?: string; limit?: number }) {
  let query = supabase.from('devices').select('*').order('updated_at', { ascending: false });
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.device_type) query = query.eq('device_type', filters.device_type);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getDeviceById(id: string) {
  const { data, error } = await supabase.from('devices').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateDevice(id: string, updates: Partial<Device>) {
  const { data, error } = await supabase
    .from('devices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteDevice(id: string) {
  const { error } = await supabase.from('devices').delete().eq('id', id);
  if (error) throw error;
}

export async function assignDevice(assignment: Omit<DeviceAssignment, 'id' | 'assigned_at'>) {
  const { data, error } = await supabase
    .from('device_assignments')
    .insert(assignment)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function unassignDevice(assignmentId: string) {
  const { data, error } = await supabase
    .from('device_assignments')
    .update({ unassigned_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDeviceAssignments(deviceId: string) {
  const { data, error } = await supabase
    .from('device_assignments')
    .select(`
      *,
      device:device_id(*),
      vehicle:assigned_vehicle_id(*),
      user:assigned_user_id(id, full_name, avatar_url)
    `)
    .eq('device_id', deviceId)
    .is('unassigned_at', null)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getVehicleDevices(vehicleId: string) {
  const { data, error } = await supabase
    .from('device_assignments')
    .select(`
      *,
      device:device_id(*)
    `)
    .eq('assigned_vehicle_id', vehicleId)
    .eq('assigned_type', 'vehicle')
    .is('unassigned_at', null);
  if (error) throw error;
  return (data || []).map((d: any) => d.device);
}

export async function getUserDevices(userId: string) {
  const { data, error } = await supabase
    .from('device_assignments')
    .select(`
      *,
      device:device_id(*)
    `)
    .eq('assigned_user_id', userId)
    .is('unassigned_at', null);
  if (error) throw error;
  return (data || []).map((d: any) => d.device);
}

export async function updateDeviceHealth(id: string, health: string) {
  return updateDevice(id, { camera_health: health });
}

export async function reconnectDevice(id: string) {
  return updateDevice(id, { status: 'online', last_sync_at: new Date().toISOString() });
}

export const DEVICE_TYPES = [
  { id: 'front_dashcam', name: 'Front Dashcam', icon: '📹' },
  { id: 'rear_dashcam', name: 'Rear Dashcam', icon: '📷' },
  { id: 'cabin_camera', name: 'Cabin Camera', icon: '🎥' },
  { id: 'side_camera', name: 'Side Camera', icon: '📸' },
  { id: 'trailer_camera', name: 'Trailer Camera', icon: '🚛' },
  { id: 'body_camera', name: 'Body Camera', icon: '👮' },
  { id: 'helmet_camera', name: 'Helmet Camera', icon: '⛑️' },
  { id: 'inspection_camera', name: 'Inspection Camera', icon: '🔍' },
  { id: 'tow_camera', name: 'Tow Camera', icon: '🚗' },
  { id: 'ambulance_camera', name: 'Ambulance Camera', icon: '🚑' },
  { id: 'fire_camera', name: 'Fire Camera', icon: '🚒' },
  { id: 'evidence_camera', name: 'Evidence Camera', icon: '📋' },
  { id: 'phone_dashcam', name: 'Phone Dashcam', icon: '📱' },
  { id: 'cargo_camera', name: 'Cargo Camera', icon: '📦' },
  { id: 'roof_camera', name: 'Roof Camera', icon: '🏠' },
];

export const CONNECTION_TYPES = [
  { id: 'bluetooth', name: 'Bluetooth' },
  { id: 'wifi', name: 'Wi-Fi' },
  { id: 'usb', name: 'USB' },
  { id: 'phone_camera', name: 'Phone Camera' },
  { id: 'oem_integration', name: 'OEM Integration' },
];
