import { supabase } from '@/lib/supabase';
import { getDevices, updateDevice } from './device.service';

export interface CameraStatus {
  deviceId: string;
  isRecording: boolean;
  isLive: boolean;
  batteryLevel?: number;
  storageRemaining?: number;
  signalStrength?: number;
  temperature?: number;
  lastFrame?: string;
  error?: string;
}

export interface RecordingConfig {
  resolution: string;
  frameRate: number;
  audioEnabled: boolean;
  microphoneEnabled: boolean;
  autoUpload: boolean;
  wifiOnlyUpload: boolean;
  encryptionEnabled: boolean;
}

export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  resolution: '1080p',
  frameRate: 30,
  audioEnabled: true,
  microphoneEnabled: true,
  autoUpload: false,
  wifiOnlyUpload: true,
  encryptionEnabled: true,
};

export async function getCameraStatus(deviceId: string): Promise<CameraStatus> {
  const { data: device } = await supabase
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .single();

  if (!device) throw new Error('Device not found');

  return {
    deviceId: device.id,
    isRecording: false, // Would come from device API
    isLive: device.status === 'online',
    batteryLevel: device.battery_level,
    storageRemaining: device.storage_remaining_gb,
    signalStrength: device.signal_strength,
    temperature: undefined,
    lastFrame: undefined,
    error: device.status === 'error' ? 'Device error reported' : undefined,
  };
}

export async function startLivePreview(deviceId: string) {
  const { data, error } = await supabase.functions.invoke('camera-operations', {
    body: { action: 'start_preview', device_id: deviceId }
  });
  if (error) throw error;
  return data;
}

export async function stopLivePreview(deviceId: string) {
  const { data, error } = await supabase.functions.invoke('camera-operations', {
    body: { action: 'stop_preview', device_id: deviceId }
  });
  if (error) throw error;
  return data;
}

export async function captureSnapshot(deviceId: string) {
  const { data, error } = await supabase.functions.invoke('camera-operations', {
    body: { action: 'capture_snapshot', device_id: deviceId }
  });
  if (error) throw error;
  return data;
}

export async function updateRecordingConfig(deviceId: string, config: Partial<RecordingConfig>) {
  return updateDevice(deviceId, {
    resolution_preference: config.resolution,
    frame_rate: config.frameRate,
    audio_enabled: config.audioEnabled,
    microphone_enabled: config.microphoneEnabled,
    auto_upload: config.autoUpload,
    wifi_only_upload: config.wifiOnlyUpload,
    encryption_enabled: config.encryptionEnabled,
  });
}

export async function getRecordingConfig(deviceId: string): Promise<RecordingConfig> {
  const { data: device } = await supabase
    .from('devices')
    .select('resolution_preference, frame_rate, audio_enabled, microphone_enabled, auto_upload, wifi_only_upload, encryption_enabled')
    .eq('id', deviceId)
    .single();

  if (!device) return DEFAULT_RECORDING_CONFIG;

  return {
    resolution: device.resolution_preference || '1080p',
    frameRate: device.frame_rate || 30,
    audioEnabled: device.audio_enabled ?? true,
    microphoneEnabled: device.microphone_enabled ?? true,
    autoUpload: device.auto_upload ?? false,
    wifiOnlyUpload: device.wifi_only_upload ?? true,
    encryptionEnabled: device.encryption_enabled ?? true,
  };
}

export async function toggleTorch(deviceId: string, on: boolean) {
  const { data, error } = await supabase.functions.invoke('camera-operations', {
    body: { action: 'toggle_torch', device_id: deviceId, on }
  });
  if (error) throw error;
  return data;
}

export async function setZoom(deviceId: string, zoomLevel: number) {
  const { data, error } = await supabase.functions.invoke('camera-operations', {
    body: { action: 'set_zoom', device_id: deviceId, zoom: zoomLevel }
  });
  if (error) throw error;
  return data;
}

export async function switchCamera(deviceId: string, camera: 'front' | 'rear' | 'cabin') {
  const { data, error } = await supabase.functions.invoke('camera-operations', {
    body: { action: 'switch_camera', device_id: deviceId, camera }
  });
  if (error) throw error;
  return data;
}

export async function getMultiCameraView(vehicleId: string) {
  const { data: assignments } = await supabase
    .from('device_assignments')
    .select(`
      device:device_id(*)
    `)
    .eq('assigned_vehicle_id', vehicleId)
    .eq('assigned_type', 'vehicle')
    .is('unassigned_at', null);

  const cameras = (assignments || [])
    .map((a: any) => a.device)
    .filter((d: any) => d && d.status === 'online');

  return cameras;
}

export async function muteMicrophone(deviceId: string, muted: boolean) {
  return updateDevice(deviceId, { microphone_enabled: !muted });
}

export async function enableNightMode(deviceId: string, enabled: boolean) {
  const { data, error } = await supabase.functions.invoke('camera-operations', {
    body: { action: 'night_mode', device_id: deviceId, enabled }
  });
  if (error) throw error;
  return data;
}
