// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HealthSettingsScreen() {
  const router = useRouter();
  
  // Honest state: these are disabled or show Kamo messaging because 
  // the full implementation requires specific hardware/firmware.
  const [offlineMode, setOfflineMode] = useState(false);
  const [auditLogging, setAuditLogging] = useState(false);

  const handleKamoFeature = (featureName: string) => {
    Alert.alert(
      'Kamo Device Feature',
      `${featureName} is currently being prepared and optimized for Kamo secure hardware/firmware. It is not available on standard devices yet.`,
      [{ text: 'Understood' }]
    );
  };

  const handleClearCache = () => {
    // Honest messaging: we don't fake a success alert for something we don't do.
    Alert.alert(
      'System Info',
      'Cache management is handled by your device operating system. MTAA OS does not manually clear system cache.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health System Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Text style={styles.settingDesc}>Sync records when connection is restored</Text>
          </View>
          <Switch 
            value={offlineMode} 
            onValueChange={() => handleKamoFeature('Offline Mode')}
            disabled={true} // Disabled to prevent fake toggling
            trackColor={{ false: '#334155', true: '#334155' }}
            thumbColor={'#94a3b8'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Audit Logging</Text>
            <Text style={styles.settingDesc}>Track all access to patient records</Text>
          </View>
          <Switch 
            value={auditLogging} 
            onValueChange={() => handleKamoFeature('Audit Logging')}
            disabled={true}
            trackColor={{ false: '#334155', true: '#334155' }}
            thumbColor={'#94a3b8'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        
        <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Clear Cache</Text>
            <Text style={styles.settingDesc}>Manage local temporary files</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#8b5cf6" />
        <Text style={styles.infoText}>
          Advanced health system features (like secure offline sync and hardware-backed audit logs) are being developed specifically for Kamo devices to ensure maximum patient data privacy.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  settingInfo: { flex: 1, paddingRight: 16 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  settingDesc: { fontSize: 13, color: '#64748b' },
  infoBox: { flexDirection: 'row', gap: 12, margin: 16, padding: 16, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
  infoText: { flex: 1, color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
});
