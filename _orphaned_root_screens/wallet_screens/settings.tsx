// app/(os)/wallet/settings.tsx
// MTAA Wallet Settings Screen

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>PIN Protection</Text>
          <Switch value={pinEnabled} onValueChange={setPinEnabled} trackColor={{ false: '#e2e8f0', true: '#6366f1' }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Biometric Login</Text>
          <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ false: '#e2e8f0', true: '#6366f1' }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Transaction Alerts</Text>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#e2e8f0', true: '#6366f1' }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Coming Soon', 'Change PIN feature in development')}>
          <Text style={styles.actionLabel}>Change PIN</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Coming Soon', 'Linked accounts feature in development')}>
          <Text style={styles.actionLabel}>Linked Accounts</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('Coming Soon', 'Export statement feature in development')}>
          <Text style={styles.actionLabel}>Export Statement</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  section: { marginTop: 16, marginHorizontal: 16, padding: 16, backgroundColor: '#fff', borderRadius: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 15, color: '#0f172a' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actionLabel: { fontSize: 15, color: '#0f172a' },
});
