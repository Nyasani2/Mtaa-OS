import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Vibration, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EmergencyConsole() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  useEffect(() => {
    loadEmergencyData();
    const channel = supabase.channel('emergency_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'education_emergency_alerts' }, (payload) => {
        Vibration.vibrate([0, 500, 200, 500]);
        Alert.alert('🚨 NEW EMERGENCY ALERT', payload.new.title);
        loadEmergencyData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadEmergencyData = async () => {
    try {
      const { data: alerts } = await supabase.from('education_emergency_alerts').select('*').eq('status', 'active').order('reported_at', { ascending: false });
      const { data: points } = await supabase.from('education_biometric_checkpoints').select('*').order('name');
      setActiveAlerts(alerts || []);
      setCheckpoints(points || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const triggerEmergency = async (type: string) => {
    const guidance = type === 'fire' ? 'ASIS Guidance: Evacuate calmly via designated routes.' :
                     type === 'terrorist' ? 'ASIS Guidance: LOCKDOWN. Lock doors, turn off lights.' :
                     'ASIS Guidance: Secure the area.';
    
    try {
      await supabase.from('education_emergency_alerts').insert({
        institution_id: (user as any)?.institution_id,
        type, severity: 'critical', title: `${type.toUpperCase()} EMERGENCY`,
        description: `Triggered by ${user?.email}`, asis_guidance: guidance,
        reported_by: user?.id, reported_at: new Date().toISOString()
      });
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000]);
      Alert.alert('🚨 EMERGENCY ACTIVATED', 'ASIS has been notified.');
      loadEmergencyData();
    } catch (e) { Alert.alert('Error', 'Failed to trigger emergency'); }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await supabase.from('education_emergency_alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', alertId);
      loadEmergencyData();
    } catch (e) { Alert.alert('Error', 'Failed to resolve'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ef4444" /></View>;

  return (
    <View style={styles.container}>
      <View style={[styles.header, emergencyMode && styles.headerEmergency]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{emergencyMode ? '🚨 EMERGENCY MODE' : 'Safety & Security'}</Text>
          <Text style={styles.headerSub}>ASIS Monitoring Active</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!emergencyMode && (
          <>
            <Text style={styles.sectionTitle}>Trigger Emergency</Text>
            <View style={styles.emergencyGrid}>
              <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#dc2626' }]} onPress={() => triggerEmergency('fire')}>
                <Ionicons name="flame" size={28} color="#fff" /><Text style={styles.emergencyBtnText}>FIRE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#7c3aed' }]} onPress={() => triggerEmergency('terrorist')}>
                <Ionicons name="warning" size={28} color="#fff" /><Text style={styles.emergencyBtnText}>TERROR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#059669' }]} onPress={() => triggerEmergency('medical')}>
                <Ionicons name="medical" size={28} color="#fff" /><Text style={styles.emergencyBtnText}>MEDICAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#f59e0b' }]} onPress={() => triggerEmergency('security')}>
                <Ionicons name="shield" size={28} color="#fff" /><Text style={styles.emergencyBtnText}>SECURITY</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            {activeAlerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alert.severity === 'critical' ? '#dc2626' : '#f59e0b' }]}>
                <View style={styles.alertHeader}>
                  <Ionicons name={alert.type === 'fire' ? 'flame' : 'warning'} size={24} color={alert.severity === 'critical' ? '#dc2626' : '#f59e0b'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                  </View>
                </View>
                {alert.asis_guidance && (
                  <View style={styles.asisGuidance}>
                    <Ionicons name="shield-checkmark" size={16} color="#38bdf8" />
                    <Text style={styles.asisText}>{alert.asis_guidance}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.resolveBtn} onPress={() => resolveAlert(alert.id)}>
                  <Text style={styles.resolveText}>Mark Resolved</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Checkpoints</Text>
          {checkpoints.map((cp) => (
            <TouchableOpacity key={cp.id} style={styles.checkpointCard} onPress={() => router.push({ pathname: '/(education)/biometric-checkin', params: { id: cp.id } } as any)}>
              <View style={[styles.cpIcon, { backgroundColor: cp.status === 'online' ? '#05966920' : '#ef444420' }]}>
                <Ionicons name={cp.type === 'gate' ? 'business' : cp.type === 'bus' ? 'bus' : 'finger-print'} size={24} color={cp.status === 'online' ? '#059669' : '#ef4444'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cpName}>{cp.name}</Text>
                <Text style={styles.cpLocation}>{cp.location} • {cp.scans_today} scans today</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: cp.status === 'online' ? '#059669' : '#ef4444' }]}>
                <Text style={styles.statusText}>{cp.status.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerEmergency: { backgroundColor: '#7f1d1d' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emergencyBtn: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emergencyBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  alertCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  alertDesc: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  asisGuidance: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, backgroundColor: '#1e3a5f', borderRadius: 8 },
  asisText: { flex: 1, fontSize: 13, color: '#7dd3fc', lineHeight: 18 },
  resolveBtn: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start' },
  resolveText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  checkpointCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cpIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cpName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cpLocation: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
