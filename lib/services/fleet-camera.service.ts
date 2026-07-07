import { supabase } from '@/lib/supabase';

export interface FleetCameraStatus {
  vehicle_id: string;
  vehicle_name: string;
  cameras: {
    device_id: string;
    device_type: string;
    status: string;
    is_recording: boolean;
    battery_level?: number;
    storage_remaining?: number;
    signal_strength?: number;
    last_sync?: string;
  }[];
  online: boolean;
  recording_status: 'none' | 'partial' | 'all';
  health_status: 'healthy' | 'degraded' | 'critical';
}

export interface FleetAlert {
  id: string;
  alert_type: string;
  severity: string;
  vehicle_id: string;
  device_id?: string;
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export async function getFleetCameraStatus(): Promise<FleetCameraStatus[]> {
  const { data: vehicles } = await supabase
    .from('trucks')
    .select('id, plate_number, make, model');

  const { data: assignments } = await supabase
    .from('device_assignments')
    .select(`
      device:device_id(*),
      vehicle:assigned_vehicle_id(id)
    `)
    .eq('assigned_type', 'vehicle')
    .is('unassigned_at', null);

  const fleetStatus: FleetCameraStatus[] = [];

  for (const vehicle of vehicles || []) {
    const vehicleCameras = (assignments || [])
      .filter((a: any) => a.vehicle?.id === vehicle.id)
      .map((a: any) => ({
        device_id: a.device.id,
        device_type: a.device.device_type,
        status: a.device.status,
        is_recording: false, // Would come from live status
        battery_level: a.device.battery_level,
        storage_remaining: a.device.storage_remaining_gb,
        signal_strength: a.device.signal_strength,
        last_sync: a.device.last_sync_at,
      }));

    const onlineCams = vehicleCameras.filter((c: any) => c.status === 'online');
    const recordingCams = vehicleCameras.filter((c: any) => c.is_recording);
    const degradedCams = vehicleCameras.filter((c: any) => c.battery_level !== undefined && c.battery_level < 20);

    fleetStatus.push({
      vehicle_id: vehicle.id,
      vehicle_name: `${vehicle.make} ${vehicle.model} (${vehicle.plate_number})`,
      cameras: vehicleCameras,
      online: onlineCams.length > 0,
      recording_status: recordingCams.length === 0 ? 'none' : recordingCams.length === vehicleCameras.length ? 'all' : 'partial',
      health_status: degradedCams.length > 0 ? 'degraded' : 'healthy',
    });
  }

  return fleetStatus;
}

export async function getFleetAlerts(filters?: { severity?: string; acknowledged?: boolean; limit?: number }) {
  let query = supabase
    .from('fleet_alerts')
    .select(`
      *,
      vehicle:vehicle_id(plate_number, make, model),
      device:device_id(name, device_type),
      ack_by:acknowledged_by(id, full_name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.acknowledged !== undefined) query = query.eq('acknowledged', filters.acknowledged);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function acknowledgeAlert(alertId: string) {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('fleet_alerts')
    .update({
      acknowledged: true,
      acknowledged_by: user.user?.id,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createFleetAlert(alert: Omit<FleetAlert, 'id' | 'created_at' | 'acknowledged'>) {
  const { data, error } = await supabase
    .from('fleet_alerts')
    .insert({ ...alert, acknowledged: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFleetStorageOverview() {
  const { data: devices } = await supabase
    .from('devices')
    .select('storage_remaining_gb, storage_total_gb, device_type, status');

  const totalStorage = (devices || []).reduce((sum: number, d: any) => sum + (d.storage_total_gb || 0), 0);
  const usedStorage = (devices || []).reduce((sum: number, d: any) => sum + ((d.storage_total_gb || 0) - (d.storage_remaining_gb || 0)), 0);

  return {
    total_devices: (devices || []).length,
    online_devices: (devices || []).filter((d: any) => d.status === 'online').length,
    total_storage_gb: Math.round(totalStorage * 10) / 10,
    used_storage_gb: Math.round(usedStorage * 10) / 10,
    available_storage_gb: Math.round((totalStorage - usedStorage) * 10) / 10,
    utilization_percent: totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0,
  };
}

export async function getFleetRecordingSummary(periodDays: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const { data: recordings } = await supabase
    .from('recordings')
    .select('recording_type, duration_seconds, file_size_bytes, upload_status')
    .gte('started_at', startDate.toISOString());

  const byType: Record<string, { count: number; duration: number; size: number }> = {};
  (recordings || []).forEach((r: any) => {
    const type = r.recording_type;
    if (!byType[type]) byType[type] = { count: 0, duration: 0, size: 0 };
    byType[type].count++;
    byType[type].duration += r.duration_seconds || 0;
    byType[type].size += r.file_size_bytes || 0;
  });

  return {
    period_days: periodDays,
    total_recordings: (recordings || []).length,
    total_duration_hours: Math.round(((recordings || []).reduce((sum: number, r: any) => sum + (r.duration_seconds || 0), 0) / 3600) * 10) / 10,
    total_size_gb: Math.round(((recordings || []).reduce((sum: number, r: any) => sum + (r.file_size_bytes || 0), 0) / (1024 * 1024 * 1024)) * 100) / 100,
    by_type: byType,
    pending_uploads: (recordings || []).filter((r: any) => r.upload_status === 'pending').length,
  };
}

export async function bulkDeviceAction(deviceIds: string[], action: 'reboot' | 'update_firmware' | 'reset') {
  const results = [];
  for (const deviceId of deviceIds) {
    try {
      const { data } = await supabase.functions.invoke('camera-operations', {
        body: { action: action === 'reboot' ? 'reboot' : action === 'update_firmware' ? 'update_firmware' : 'factory_reset', device_id: deviceId },
      });
      results.push({ deviceId, success: true, result: data });
    } catch (e: any) {
      results.push({ deviceId, success: false, error: e.message });
    }
  }
  return results;
}
