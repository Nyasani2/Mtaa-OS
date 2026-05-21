// app/(os)/settings/tx-alerts.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface AlertSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: string;
  color: string;
}

export default function TxAlertsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AlertSetting[]>([
    { id: 'all_tx', label: 'All Transactions', description: 'Get notified for every transaction', enabled: true, icon: 'swap-horizontal', color: '#3B82F6' },
    { id: 'large_tx', label: 'Large Transactions', description: 'Alert for transactions above threshold', enabled: true, icon: 'trending-up', color: '#F59E0B' },
    { id: 'failed_tx', label: 'Failed Transactions', description: 'Immediate alert on failed payments', enabled: true, icon: 'close-circle', color: '#EF4444' },
    { id: 'login', label: 'New Login', description: 'Alert when account is accessed from new device', enabled: true, icon: 'log-in', color: '#8B5CF6' },
    { id: 'password_change', label: 'Password Changes', description: 'Alert when password is changed', enabled: true, icon: 'key', color: '#10B981' },
    { id: 'kyc_update', label: 'KYC Updates', description: 'Alert on verification status changes', enabled: false, icon: 'shield-checkmark', color: '#06B6D4' },
    { id: 'escrow', label: 'Escrow Events', description: 'Updates on escrow releases and disputes', enabled: true, icon: 'lock-closed', color: '#EC4899' },
    { id: 'marketing', label: 'Promotions', description: 'Special offers and app updates', enabled: false, icon: 'megaphone', color: '#64748B' },
  ]);

  const [threshold, setThreshold] = useState('10000');

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.thresholdCard}>
          <Text style={styles.thresholdLabel}>Large Transaction Threshold</Text>
          <View style={styles.thresholdRow}>
            <Text style={styles.currency}>KES</Text>
            <TextInput
              style={styles.thresholdInput}
              value={threshold}
              onChangeText={setThreshold}
              keyboardType="numeric"
              placeholder="10000"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Alert Preferences</Text>

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

        <View style={styles.channelsCard}>
          <Text style={styles.channelsTitle}>Notification Channels</Text>
          <View style={styles.channelRow}>
            <Ionicons name="phone-portrait" size={20} color="#3B82F6" />
            <Text style={styles.channelLabel}>Push Notifications</Text>
            <Switch value={true} trackColor={{ false: '#E2E8F0', true: '#3B82F6' }} />
          </View>
          <View style={styles.channelRow}>
            <Ionicons name="mail" size={20} color="#3B82F6" />
            <Text style={styles.channelLabel}>Email</Text>
            <Switch value={true} trackColor={{ false: '#E2E8F0', true: '#3B82F6' }} />
          </View>
          <View style={styles.channelRow}>
            <Ionicons name="chatbubble" size={20} color="#3B82F6" />
            <Text style={styles.channelLabel}>SMS</Text>
            <Switch value={false} trackColor={{ false: '#E2E8F0', true: '#3B82F6' }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, padding: 16 },
  thresholdCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  thresholdLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  currency: { fontSize: 16, fontWeight: '700', color: '#3B82F6', marginRight: 8 },
  thresholdInput: { flex: 1, fontSize: 16, color: '#1E293B' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  settingDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  channelsCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 16 },
  channelsTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  channelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  channelLabel: { flex: 1, fontSize: 14, color: '#475569', marginLeft: 12 },
});
