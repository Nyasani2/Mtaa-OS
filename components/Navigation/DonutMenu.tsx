// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FEATURE_REGISTRY, isFeatureAvailable } from '@/lib/config/feature-capabilities';

const IS_KAMO_DEVICE = false;

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'edu_qr_checkin', label: 'Scan QR', icon: 'qr-code', route: '/(education)/qr-checkin', color: '#10b981' },
  { id: 'edu_post', label: 'Create Post', icon: 'create', route: '/(education)/feed/create', color: '#3b82f6' },
  { id: 'health_vitals', label: 'Log Vitals', icon: 'pulse', route: '/(os)/health/patient/vitals', color: '#ef4444' },
  { id: 'transport_track', label: 'Track Transport', icon: 'bus', route: '/(education)/transport', color: '#f59e0b' },
];

export default function DonutMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [kamoMessage, setKamoMessage] = useState<string | null>(null);

  const handleAction = (action: QuickAction) => {
    const availability = isFeatureAvailable(action.id, IS_KAMO_DEVICE);
    if (!availability.available) {
      setKamoMessage(availability.message || 'Not available.');
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    router.push(action.route as any);
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, isOpen && styles.fabOpen]} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Ionicons name={isOpen ? "close" : "add"} size={28} color="#fff" />
      </TouchableOpacity>

      {/* Expanded Menu */}
      {isOpen && (
        <View style={styles.menuContainer}>
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity 
              key={action.id}
              style={[styles.menuItem, { bottom: 80 + (index * 60) }]}
              onPress={() => handleAction(action)}
            >
              <View style={[styles.iconBox, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={20} color="#fff" />
              </View>
              <View style={styles.labelBox}>
                <Text style={styles.labelText}>{action.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Kamo Limitation Modal */}
      {kamoMessage && (
        <Modal visible={!!kamoMessage} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.kamoModal}>
              <Ionicons name="hardware-chip-outline" size={40} color="#8b5cf6" />
              <Text style={styles.kamoTitle}>Feature Unavailable</Text>
              <Text style={styles.kamoMessage}>{kamoMessage}</Text>
              <TouchableOpacity style={styles.kamoBtn} onPress={() => setKamoMessage(null)}>
                <Text style={styles.kamoBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 100,
  },
  fabOpen: {
    backgroundColor: '#ef4444',
    transform: [{ rotate: '45deg' }],
  },
  menuContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 99,
  },
  menuItem: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  labelBox: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  labelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  kamoModal: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  kamoTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 12, marginBottom: 8 },
  kamoMessage: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  kamoBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  kamoBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
