// app/(os)/settings/notifications.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: string;
  color: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [masterToggle, setMasterToggle] = useState(true);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: 'wallet', label: 'Wallet', description: 'Transaction confirmations, balance updates', enabled: true, icon: 'wallet', color: '#10B981' },
    { id: 'health', label: 'Health', description: 'Appointment reminders, lab results', enabled: true, icon: 'medical', color: '#EF4444' },
    { id: 'mtaxi', label: 'MTaxi', description: 'Ride status, driver updates', enabled: true, icon: 'car', color: '#F59E0B' },
    { id: 'jobs', label: 'Jobs', description: 'New listings, application status', enabled: true, icon: 'briefcase', color: '#3B82F6' },
    { id: 'marketplace', label: 'Marketplace', description: 'Order updates, messages', enabled: true, icon: 'cart', color: '#8B5CF6' },
    { id: 'tribes', label: 'Tribes', description: 'New posts, mentions, invites', enabled: false, icon: 'people', color: '#EC4899' },
    { id: 'security', label: 'Security', description: 'Login alerts, password changes', enabled: true, icon: 'shield-checkmark', color: '#06B6D4' },
    { id: 'system', label: 'System', description: 'App updates, maintenance notices', enabled: true, icon: 'cog', color: '#64748B' },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.masterToggle}>
          <View style={styles.masterInfo}>
            <Ionicons name="notifications" size={24} color="#3B82F6" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.masterLabel}>Enable Notifications</Text>
              <Text style={styles.masterDesc}>Master toggle for all notifications</Text>
            </View>
          </View>
          <Switch value={masterToggle} onValueChange={setMasterToggle} trackColor={{ false: '#E2E8F0', true: '#3B82F6' }} />
        </View>

        {masterToggle && (
          <>
            <Text style={styles.sectionTitle}>App Notifications</Text>
            {settings.map((setting) => (
              <View key={setting.id} style={styles.settingRow}>
                <View style={[styles.iconContainer, { backgroundColor: setting.color + '15' }]}>
                  <Ionicons name={setting.icon as any} size={20} color={setting.color} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingDesc}>{setting.description}</Text>
                </View>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.txAlertsLink} onPress={() => router.push('/settings/tx-alerts' as any)}>
              <View style={styles.linkInfo}>
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                <Text style={styles.linkLabel}>Transaction Alerts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, padding: 16 },
  masterToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  masterInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  masterLabel: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  masterDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  settingDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  txAlertsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 8 },
  linkInfo: { flexDirection: 'row', alignItems: 'center' },
  linkLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginLeft: 12 },
});
