import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const BUILDINGS = [
  { id: 'admin', name: 'Admin Block', x: 50, y: 50, type: 'office', color: '#3b82f6', cameras: 2 },
  { id: 'class-a', name: 'Class Block A', x: 50, y: 150, type: 'classroom', color: '#10b981', cameras: 4 },
  { id: 'class-b', name: 'Class Block B', x: 50, y: 250, type: 'classroom', color: '#10b981', cameras: 4 },
  { id: 'library', name: 'Library', x: 200, y: 50, type: 'facility', color: '#8b5cf6', cameras: 2 },
  { id: 'lab', name: 'Computer Lab', x: 200, y: 150, type: 'facility', color: '#f59e0b', cameras: 2 },
  { id: 'dining', name: 'Dining Hall', x: 200, y: 250, type: 'facility', color: '#ec4899', cameras: 2 },
  { id: 'playground', name: 'Playground', x: 350, y: 100, type: 'outdoor', color: '#059669', cameras: 3 },
  { id: 'assembly', name: 'Assembly Ground', x: 350, y: 200, type: 'outdoor', color: '#6366f1', cameras: 2 },
  { id: 'gate', name: 'Main Gate', x: 20, y: 300, type: 'security', color: '#ef4444', cameras: 2 },
  { id: 'parking', name: 'Parking', x: 120, y: 300, type: 'facility', color: '#64748b', cameras: 1 },
  { id: 'bus', name: 'Bus Bay', x: 250, y: 300, type: 'transport', color: '#0ea5e9', cameras: 1 },
  { id: 'medical', name: 'Medical Room', x: 350, y: 300, type: 'health', color: '#dc2626', cameras: 0 },
];

const SAFE_ZONES = [
  { id: 'sz1', name: 'Assembly Point A', x: 100, y: 380 },
  { id: 'sz2', name: 'Assembly Point B', x: 250, y: 380 },
];

const EMERGENCY_EXITS = [
  { id: 'e1', name: 'Exit 1', x: 10, y: 100 },
  { id: 'e2', name: 'Exit 2', x: 390, y: 100 },
  { id: 'e3', name: 'Exit 3', x: 200, y: 390 },
];

export default function SchoolMap() {
  const router = useRouter();
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [overlay, setOverlay] = useState('all'); // all, cameras, emergency, crowd

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Map</Text>
        <TouchableOpacity onPress={() => setOverlay(overlay === 'all' ? 'cameras' : overlay === 'cameras' ? 'emergency' : 'all')}>
          <Ionicons name="layers-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Overlay Toggle */}
      <View style={styles.overlayBar}>
        <TouchableOpacity style={[styles.overlayBtn, overlay === 'all' && styles.overlayBtnActive]} onPress={() => setOverlay('all')}>
          <Text style={[styles.overlayText, overlay === 'all' && styles.overlayTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.overlayBtn, overlay === 'cameras' && styles.overlayBtnActive]} onPress={() => setOverlay('cameras')}>
          <Ionicons name="videocam-outline" size={14} color={overlay === 'cameras' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.overlayText, overlay === 'cameras' && styles.overlayTextActive]}>Cameras</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.overlayBtn, overlay === 'emergency' && styles.overlayBtnActive]} onPress={() => setOverlay('emergency')}>
          <Ionicons name="warning-outline" size={14} color={overlay === 'emergency' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.overlayText, overlay === 'emergency' && styles.overlayTextActive]}>Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.overlayBtn, overlay === 'crowd' && styles.overlayBtnActive]} onPress={() => setOverlay('crowd')}>
          <Ionicons name="people-outline" size={14} color={overlay === 'crowd' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.overlayText, overlay === 'crowd' && styles.overlayTextActive]}>Crowd</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <View style={styles.map}>
          {/* Grid */}
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`h${i}`} style={[styles.gridLine, { top: i * 40, width: '100%', height: 1 }]} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`v${i}`} style={[styles.gridLine, { left: i * 40, height: '100%', width: 1 }]} />
          ))}

          {/* Buildings */}
          {BUILDINGS.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.building,
                { left: b.x, top: b.y, backgroundColor: b.color + '20', borderColor: b.color },
                selectedBuilding?.id === b.id && styles.buildingSelected,
              ]}
              onPress={() => setSelectedBuilding(selectedBuilding?.id === b.id ? null : b)}
            >
              <Ionicons 
                name={b.type === 'office' ? 'business-outline' : b.type === 'classroom' ? 'school-outline' : b.type === 'facility' ? 'cube-outline' : b.type === 'outdoor' ? 'sunny-outline' : b.type === 'security' ? 'shield-outline' : b.type === 'transport' ? 'bus-outline' : 'medical-outline'} 
                size={16} 
                color={b.color} 
              />
              <Text style={[styles.buildingText, { color: b.color }]}>{b.name}</Text>
              {overlay === 'cameras' && b.cameras > 0 && (
                <View style={styles.cameraBadge}>
                  <Ionicons name="videocam" size={10} color="#fff" />
                  <Text style={styles.cameraBadgeText}>{b.cameras}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Safe Zones */}
          {(overlay === 'emergency' || overlay === 'all') && SAFE_ZONES.map(sz => (
            <View key={sz.id} style={[styles.safeZone, { left: sz.x, top: sz.y }]}>
              <Ionicons name="flag" size={14} color="#10b981" />
              <Text style={styles.safeZoneText}>{sz.name}</Text>
            </View>
          ))}

          {/* Emergency Exits */}
          {(overlay === 'emergency' || overlay === 'all') && EMERGENCY_EXITS.map(ex => (
            <View key={ex.id} style={[styles.exit, { left: ex.x, top: ex.y }]}>
              <Ionicons name="exit-outline" size={14} color="#ef4444" />
              <Text style={styles.exitText}>{ex.name}</Text>
            </View>
          ))}

          {/* Crowd density indicator */}
          {overlay === 'crowd' && (
            <>
              <View style={[styles.crowdZone, { left: 40, top: 140, width: 80, height: 120, backgroundColor: 'rgba(16,185,129,0.2)' }]} />
              <View style={[styles.crowdZone, { left: 340, top: 90, width: 60, height: 80, backgroundColor: 'rgba(245,158,11,0.3)' }]} />
              <View style={[styles.crowdZone, { left: 180, top: 240, width: 100, height: 60, backgroundColor: 'rgba(16,185,129,0.2)' }]} />
            </>
          )}
        </View>
      </View>

      {/* Selected Building Info */}
      {selectedBuilding && (
        <View style={styles.infoPanel}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>{selectedBuilding.name}</Text>
            <TouchableOpacity onPress={() => setSelectedBuilding(null)}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="videocam-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>{selectedBuilding.cameras} cameras</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>~{selectedBuilding.type === 'classroom' ? '40' : selectedBuilding.type === 'facility' ? '60' : '20'} people</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>Status: Normal</Text>
          </View>
          <TouchableOpacity style={styles.viewCctvBtn} onPress={() => router.push('/(education)/ict/cctv')}>
            <Ionicons name="videocam-outline" size={16} color="#fff" />
            <Text style={styles.viewCctvText}>View CCTV</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  overlayBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  overlayBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#334155', gap: 4 },
  overlayBtnActive: { backgroundColor: '#3b82f6' },
  overlayText: { fontSize: 12, color: '#94a3b8' },
  overlayTextActive: { color: '#fff', fontWeight: '600' },
  mapContainer: { flex: 1, padding: 12 },
  map: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: '#334155' },
  building: { position: 'absolute', padding: 8, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', minWidth: 80 },
  buildingSelected: { borderWidth: 2, shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 8 },
  buildingText: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  cameraBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginTop: 4, gap: 2 },
  cameraBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  safeZone: { position: 'absolute', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.2)', padding: 6, borderRadius: 6, gap: 4 },
  safeZoneText: { fontSize: 10, color: '#10b981', fontWeight: '600' },
  exit: { position: 'absolute', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.2)', padding: 6, borderRadius: 6, gap: 4 },
  exitText: { fontSize: 10, color: '#ef4444', fontWeight: '600' },
  crowdZone: { position: 'absolute', borderRadius: 8 },
  infoPanel: { backgroundColor: '#1e293b', padding: 16, borderTopWidth: 1, borderTopColor: '#334155' },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#94a3b8' },
  viewCctvBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, gap: 8, marginTop: 8 },
  viewCctvText: { color: '#fff', fontWeight: '700' },
});
