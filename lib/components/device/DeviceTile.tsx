import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DeviceTileProps {
  device: {
    id: string; name: string; device_type: string; status: string;
    battery_level?: number; camera_health: string;
  };
  isSelected?: boolean;
  onPress?: () => void;
}

export default function DeviceTile({ device, isSelected, onPress }: DeviceTileProps) {
  const statusColors: Record<string, string> = { online: '#22c55e', offline: '#ef4444', pairing: '#f59e0b', error: '#dc2626', maintenance: '#6b7280', retired: '#9ca3af' };
  const icons: Record<string, string> = { front_dashcam: '📹', rear_dashcam: '📷', cabin_camera: '🎥', side_camera: '📸', trailer_camera: '🚛', body_camera: '👮', helmet_camera: '⛑️', inspection_camera: '🔍', tow_camera: '🚗', ambulance_camera: '🚑', fire_camera: '🚒', evidence_camera: '📋', phone_dashcam: '📱', cargo_camera: '📦', roof_camera: '🏠' };

  return (
    <TouchableOpacity style={[styles.container, isSelected && styles.selected]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statusBar, { backgroundColor: statusColors[device.status] || '#6b7280' }]} />
      <View style={styles.content}>
        <Text style={styles.icon}>{icons[device.device_type] || '📷'}</Text>
        <Text style={styles.name} numberOfLines={1}>{device.name}</Text>
        <Text style={styles.type}>{device.device_type.replace(/_/g, ' ')}</Text>
        {device.battery_level !== undefined && (
          <View style={styles.battery}>
            <View style={[styles.batteryFill, { width: `${device.battery_level}%`, backgroundColor: device.battery_level > 20 ? '#22c55e' : '#ef4444' }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 12, width: 110, height: 130, marginRight: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  statusBar: { height: 4, width: '100%' },
  content: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 28, marginBottom: 6 },
  name: { fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  type: { fontSize: 10, color: '#94a3b8', textTransform: 'capitalize', marginTop: 2 },
  battery: { width: '80%', height: 4, backgroundColor: '#334155', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  batteryFill: { height: '100%', borderRadius: 2 },
});
