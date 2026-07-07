import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CameraCardProps {
  device: {
    id: string; name: string; device_type: string; status: string;
    battery_level?: number; storage_remaining_gb?: number;
    signal_strength?: number; camera_health: string; last_sync_at?: string;
  };
  isRecording?: boolean; isLive?: boolean;
  onPress?: () => void; onToggleLive?: () => void;
  onToggleRecord?: () => void; onSettings?: () => void;
}

export default function CameraCard({ device, isRecording, isLive, onPress, onToggleLive, onToggleRecord, onSettings }: CameraCardProps) {
  const statusColor = { online: '#22c55e', offline: '#ef4444', pairing: '#f59e0b', error: '#dc2626', maintenance: '#6b7280', retired: '#9ca3af' }[device.status] || '#6b7280';
  const healthColor = { healthy: '#22c55e', degraded: '#f59e0b', failed: '#ef4444', unknown: '#9ca3af' }[device.camera_health] || '#9ca3af';
  const icons: Record<string, string> = { front_dashcam: '📹', rear_dashcam: '📷', cabin_camera: '🎥', side_camera: '📸', trailer_camera: '🚛', body_camera: '👮', helmet_camera: '⛑️', inspection_camera: '🔍', tow_camera: '🚗', ambulance_camera: '🚑', fire_camera: '🚒', evidence_camera: '📋', phone_dashcam: '📱', cargo_camera: '📦', roof_camera: '🏠' };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.iconBox}><Text style={styles.icon}>{icons[device.device_type] || '📷'}</Text></View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{device.name}</Text>
          <Text style={styles.type}>{device.device_type.replace(/_/g, ' ')}</Text>
        </View>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
      </View>
      <View style={styles.metrics}>
        {device.battery_level !== undefined && <Metric label="🔋 Battery" value={`${device.battery_level}%`} />}
        {device.storage_remaining_gb !== undefined && <Metric label="💾 Storage" value={`${device.storage_remaining_gb}GB`} />}
        {device.signal_strength !== undefined && <Metric label="📶 Signal" value={`${device.signal_strength}%`} />}
        <Metric label="🏥 Health" value={device.camera_health} color={healthColor} />
      </View>
      <View style={styles.actions}>
        <ActionBtn label={isLive ? '⏹ Stop Live' : '▶ Live'} active={isLive} onPress={onToggleLive} disabled={device.status !== 'online'} />
        <ActionBtn label={isRecording ? '⏹ Stop' : '⏺ Record'} active={isRecording} activeColor="#ef4444" onPress={onToggleRecord} disabled={device.status !== 'online'} />
        <ActionBtn label="⚙️" onPress={onSettings} />
      </View>
      {device.last_sync_at && <Text style={styles.sync}>Last sync: {new Date(device.last_sync_at).toLocaleString()}</Text>}
    </TouchableOpacity>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, color && { color }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function ActionBtn({ label, active, activeColor, onPress, disabled }: any) {
  return (
    <TouchableOpacity style={[styles.btn, active && { backgroundColor: activeColor || '#3b82f6' }]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.btnText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  type: { fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#334155' },
  metric: { alignItems: 'center' },
  metricValue: { fontSize: 14, fontWeight: '700', color: '#fff' },
  metricLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: '#334155', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  sync: { fontSize: 10, color: '#64748b', marginTop: 10, textAlign: 'center' },
});
