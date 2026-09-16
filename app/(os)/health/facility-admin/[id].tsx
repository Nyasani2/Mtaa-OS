// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Map facility-admin routes to existing working screens to prevent 404s
const ROUTE_MAP: Record<string, string> = {
  'census': '/health/hospital-admin/beds',
  'staff-roster': '/health/hospital-admin/staff',
  'departments': '/health/hospital-admin/staff',
  'beds': '/health/hospital-admin/beds',
  'admissions': '/health/hospital-admin/admissions',
  'discharges': '/health/hospital-admin/discharges',
  'revenue': '/health/hospital-admin/revenue',
  'accounting': '/health/hospital-admin/accounting',
  'inventory': '/health/hospital-admin/inventory',
  'pos': '/health/hospital-admin/pos',
  'wallet': '/health/hospital-admin/wallet',
  'appointments': '/health/hospital-admin/appointments',
  'integrations': '/health/system/integrations',
  'system-config': '/health/system/settings',
  'audit-logs': '/health/system/audit',
  'notifications': '/health/system/notifications',
};

export default function FacilityAdminModuleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const moduleId = Array.isArray(id) ? id[0] : (id || '');
  
  const targetRoute = ROUTE_MAP[moduleId];

  // Redirect to existing working screens if mapped
  React.useEffect(() => {
    if (targetRoute) {
      router.replace(targetRoute as any);
    }
  }, [targetRoute]);

  if (targetRoute) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading {moduleId.replace('-', ' ')}...</Text>
      </View>
    );
  }

  // Fallback for modules that are still in development
  const displayName = moduleId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Ionicons name="construct" size={64} color="#3b82f6" />
          <Text style={styles.placeholderTitle}>{displayName}</Text>
          <Text style={styles.placeholderDesc}>
            This module is currently under active development. 
            Core facility management features are fully operational in the main dashboard.
          </Text>
          <TouchableOpacity style={styles.backToDashBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={styles.backToDashText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  content: { flex: 1, padding: 20 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  placeholderDesc: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  backToDashBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 32 },
  backToDashText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
