import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePatientConsent } from '@/lib/health/hooks/usePatientConsent';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Shield, Eye, Edit, Share, Download, Clock, AlertTriangle, Check, X, Fingerprint } from 'lucide-react-native';

export default function PatientConsentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeGrants, accessLog, grantConsent, revokeConsent, updateSettings, settings } = usePatientConsent();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Data Consent</Text>
        <Text style={styles.headerSub}>Control who can access your health data</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Shield size={20} color="#0A4DA6" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>QR Access</Text>
              <Text style={styles.settingDesc}>Allow QR code sharing at facilities</Text>
            </View>
          </View>
          <Switch value={settings?.qr_access_enabled ?? true} onValueChange={v => updateSettings('qr_access_enabled', v)} trackColor={{ false: '#E5E7EB', true: '#0A4DA6' }} />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Fingerprint size={20} color="#0A4DA6" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Biometric Consent</Text>
              <Text style={styles.settingDesc}>Use biometrics for record access</Text>
            </View>
          </View>
          <Switch value={settings?.biometric_consent_enabled ?? false} onValueChange={v => updateSettings('biometric_consent_enabled', v)} trackColor={{ false: '#E5E7EB', true: '#0A4DA6' }} />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <AlertTriangle size={20} color="#0A4DA6" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Emergency Access</Text>
              <Text style={styles.settingDesc}>Allow emergency override without consent</Text>
            </View>
          </View>
          <Switch value={settings?.emergency_access_granted ?? false} onValueChange={v => updateSettings('emergency_access_granted', v)} trackColor={{ false: '#E5E7EB', true: '#0A4DA6' }} />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Access Grants</Text>
        {activeGrants?.length === 0 ? (
          <View style={styles.empty}><Shield size={32} color="#D1D5DB" /><Text style={styles.emptyText}>No active grants</Text></View>
        ) : activeGrants?.map((grant: any) => (
          <View key={grant.id} style={styles.grantCard}>
            <View style={styles.grantHeader}>
              <View style={styles.grantLeft}>
                <View style={[styles.grantIcon, { backgroundColor: grant.consent_type === 'emergency_override' ? '#FEF3C7' : '#ECFDF5' }]}>
                  {grant.consent_type === 'emergency_override' ? <AlertTriangle size={16} color="#F59E0B" /> : <Eye size={16} color="#10B981" />}
                </View>
                <View>
                  <Text style={styles.grantTitle}>{grant.granted_to_name || 'Unknown'}</Text>
                  <Text style={styles.grantSub}>{grant.granted_to_type} · {grant.consent_type} · {grant.resource_type}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => revokeConsent(grant.id)} style={styles.revokeBtn}><X size={16} color="#EF4444" /></TouchableOpacity>
            </View>
            <View style={styles.grantFooter}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.grantExpiry}>Expires: {new Date(grant.expires_at).toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access History</Text>
        {accessLog?.length === 0 ? <Text style={styles.emptyText}>No access history</Text>
         : accessLog?.slice(0, 10).map((log: any) => (
          <View key={log.id} style={styles.logRow}>
            <View style={styles.logLeft}>
              <Text style={styles.logAction}>{log.action}</Text>
              <Text style={styles.logResource}>{log.resource_type} · {log.accessor_type}</Text>
            </View>
            <View style={styles.logRight}>
              {log.success ? <Check size={14} color="#10B981" /> : <X size={14} color="#EF4444" />}
              <Text style={styles.logTime}>{new Date(log.created_at).toLocaleTimeString()}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#0A4DA6', padding: 20, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingInfo: { marginLeft: 12 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  settingDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#9CA3AF', marginTop: 8 },
  grantCard: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8 },
  grantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grantLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  grantIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  grantTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  grantSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  revokeBtn: { padding: 6 },
  grantFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  grantExpiry: { fontSize: 11, color: '#9CA3AF' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  logLeft: { flex: 1 },
  logAction: { fontSize: 13, fontWeight: '600', color: '#1F2937', textTransform: 'capitalize' },
  logResource: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  logRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logTime: { fontSize: 11, color: '#9CA3AF' },
});
