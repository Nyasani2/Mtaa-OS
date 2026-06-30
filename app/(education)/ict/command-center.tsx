import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getSchools, getTeachers } from '@/lib/services/education-service';

export default function CommandCenterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const systemStatus = [
    { name: 'CCTV', value: '11/12', sub: 'Online', status: 'warning', icon: 'videocam-outline' },
    { name: 'Network', value: 'online', sub: '100 Mbps', status: 'good', icon: 'wifi-outline' },
    { name: 'Storage', value: '48%', sub: '2.4 TB', status: 'good', icon: 'cloud-outline' },
    { name: 'Devices', value: '42/45', sub: 'Active', status: 'good', icon: 'phone-portrait-outline' },
    { name: 'Biometrics', value: '8/8', sub: 'Online', status: 'good', icon: 'finger-print-outline' },
    { name: 'Gates', value: '3 Closed', sub: '1 Open', status: 'warning', icon: 'lock-closed-outline' },
  ];

  const recentAlerts = [
    { id: '1', type: 'fire', message: 'Fire drill scheduled at 10:00 AM', time: '5 min ago', severity: 'info' },
    { id: '2', type: 'security', message: 'Unauthorized access attempt at Gate 2', time: '15 min ago', severity: 'warning' },
    { id: '3', type: 'medical', message: 'Student injury reported in Block A', time: '30 min ago', severity: 'critical' },
    { id: '4', type: 'weather', message: 'Heavy rain warning issued', time: '1 hr ago', severity: 'info' },
  ];

  useEffect(() => {
    const loadTeacher = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const allTeachers = await getTeachers('').catch(() => []);
        const t = allTeachers?.find((teach: any) => teach.user_id === user.id) || null;
        setTeacher(t);
      } catch (e) { console.log('Command center load error:', e); }
      finally { setLoading(false); }
    };
    loadTeacher();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch(status) { case 'good': return '#10b981'; case 'warning': return '#f59e0b'; case 'critical': return '#ef4444'; default: return '#94a3b8'; }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) { case 'info': return '#3b82f6'; case 'warning': return '#f59e0b'; case 'critical': return '#ef4444'; default: return '#94a3b8'; }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Command Center</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#fff', marginRight: 8, fontSize: 12 }}>Emergency</Text>
          <Switch value={emergencyMode} onValueChange={setEmergencyMode} trackColor={{ false: '#64748b', true: '#ef4444' }} />
        </View>
      </View>

      {emergencyMode && (
        <View style={styles.emergencyBanner}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={styles.emergencyText}>EMERGENCY MODE ACTIVE</Text>
        </View>
      )}

      <ScrollView>
        {/* System Status */}
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusGrid}>
          {systemStatus.map((sys, i) => (
            <View key={i} style={styles.statusCard}>
              <Ionicons name={sys.icon} size={20} color={getStatusColor(sys.status)} />
              <Text style={styles.statusValue}>{sys.value}</Text>
              <Text style={styles.statusName}>{sys.name}</Text>
              <Text style={[styles.statusSub, { color: getStatusColor(sys.status) }]}>{sys.sub}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education)/emergency')}>
            <Ionicons name="warning" size={24} color="#ef4444" />
            <Text style={styles.actionBtnText}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education)/ict/cctv')}>
            <Ionicons name="videocam" size={24} color="#3b82f6" />
            <Text style={styles.actionBtnText}>CCTV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education)/ict/biometrics')}>
            <Ionicons name="finger-print" size={24} color="#10b981" />
            <Text style={styles.actionBtnText}>Biometrics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education)/ict/visitors')}>
            <Ionicons name="people" size={24} color="#8b5cf6" />
            <Text style={styles.actionBtnText}>Visitors</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Alerts */}
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {recentAlerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={[styles.alertIcon, { backgroundColor: getSeverityColor(alert.severity) + '15' }]}>
              <Ionicons name="alert-circle" size={20} color={getSeverityColor(alert.severity)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) + '20' }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(alert.severity) }]}>{alert.severity}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  emergencyBanner: { backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 },
  emergencyText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  statusCard: { width: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statusValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 6 },
  statusName: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statusSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  actionBtnText: { fontSize: 11, color: '#475569', marginTop: 6, fontWeight: '500' },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12 },
  alertIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  alertMessage: { fontSize: 13, color: '#1e293b', fontWeight: '500' },
  alertTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  severityText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
