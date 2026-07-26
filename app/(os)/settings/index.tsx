// app/(os)/settings/index.tsx — MTAA OS Settings v4.0
// Comprehensive Android/iOS-style Settings

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingsItem {
  icon: string;
  label: string;
  route?: string;
  type: 'link' | 'switch' | 'value';
  value?: string | boolean;
  onChange?: (val: boolean) => void;
  danger?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [networkType, setNetworkType] = useState('Unknown');
  const [bluetoothOn, setBluetoothOn] = useState(false);
  const [locationOn, setLocationOn] = useState(true);
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [batteryLevel] = useState(72);
  const [storageUsed] = useState(45.2);
  const [storageTotal] = useState(128);

  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'Not signed in';
  const isVerified = profile?.is_verified || false;

  useEffect(() => {
    async function checkNetwork() {
      try {
// eslint-disable-next-line @typescript-eslint/no-var-requires
        const Network = require('expo-network');
        const state = await Network.getNetworkStateAsync();
        setNetworkType(
          state.type === 'WIFI' ? 'Wi-Fi' :
          state.type === 'CELLULAR' ? 'Mobile Data' :
          state.isConnected ? 'Connected' : 'Off'
        );
      } catch {
        setNetworkType('Unknown');
      }
    }
    checkNetwork();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const sections = [
    {
      title: 'NETWORK & CONNECTIONS',
      items: [
        { icon: 'wifi-outline', label: 'Network & Internet', type: 'link', route: '/(os)/settings/network', value: networkType },
        { icon: 'bluetooth-outline', label: 'Bluetooth', type: 'switch', value: bluetoothOn, onChange: setBluetoothOn },
        { icon: 'airplane-outline', label: 'Airplane Mode', type: 'switch', value: airplaneMode, onChange: setAirplaneMode },
        { icon: 'location-outline', label: 'Location', type: 'switch', value: locationOn, onChange: setLocationOn },
      ],
    },
    {
      title: 'DEVICE',
      items: [
        { icon: 'sunny-outline', label: 'Display & Brightness', type: 'link', route: '/(os)/settings/display' },
        { icon: 'volume-high-outline', label: 'Sound & Vibration', type: 'link', route: '/(os)/settings/sound' },
        { icon: 'battery-half-outline', label: 'Battery', type: 'link', route: '/(os)/settings/battery', value: `${batteryLevel}%` },
        { icon: 'server-outline', label: 'Storage', type: 'link', route: '/(os)/settings/storage', value: `${storageUsed.toFixed(1)} GB / ${storageTotal} GB` },
        { icon: 'apps-outline', label: 'Apps', type: 'link', route: '/(os)/settings/apps' },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { icon: 'moon-outline', label: 'Dark Mode', type: 'switch', value: darkMode, onChange: setDarkMode },
        { icon: 'notifications-outline', label: 'Notifications', type: 'switch', value: notifications, onChange: setNotifications },
        { icon: 'language-outline', label: 'Language & Region', type: 'link', route: '/(os)/settings/language' },
        { icon: 'time-outline', label: 'Date & Time', type: 'link', route: '/(os)/settings/datetime' },
        { icon: 'accessibility-outline', label: 'Accessibility', type: 'link', route: '/(os)/settings/accessibility' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { icon: 'person-outline', label: 'Profile', type: 'link', route: '/(os)/profile' },
        { icon: 'wallet-outline', label: 'Wallet', type: 'link', route: '/(os)/wallet' },
        { icon: 'lock-closed-outline', label: 'Privacy', type: 'link', route: '/(os)/settings/privacy' },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { icon: 'keypad-outline', label: 'Change PIN', type: 'link', route: '/(os)/settings/change-pin' },
        { icon: 'finger-print-outline', label: 'Biometric Login', type: 'link', route: '/(os)/settings/biometric' },
        { icon: 'shield-checkmark-outline', label: 'Security Center', type: 'link', route: '/(os)/settings/security-center' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { icon: 'cloud-upload-outline', label: 'Backup & Restore', type: 'link', route: '/(os)/settings/backup' },
        { icon: 'code-slash-outline', label: 'Developer Options', type: 'link', route: '/(os)/settings/developer-options' },
        { icon: 'information-circle-outline', label: 'About MTAA OS', type: 'link', route: '/(os)/settings/about' },
        { icon: 'help-circle-outline', label: 'Help & Support', type: 'link', route: '/(os)/settings/help' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>
            {isVerified && <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 4 }} />}
          </View>
          <Text style={styles.email}>{email}</Text>
          {user && (
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.row, idx === section.items.length - 1 && styles.rowLast]}
                  onPress={() => {
                    if (item.type === 'link' && item.route) {
                      router.push(item.route as any);
                    }
                  }}
                  activeOpacity={item.type === 'switch' ? 1 : 0.7}
                  disabled={item.type === 'switch'}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.danger ? '#EF444420' : '#6366f120' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.danger ? '#EF4444' : '#6366f1'} />
                  </View>
                  <Text style={[styles.rowText, item.danger && { color: '#EF4444' }]}>{item.label}</Text>
                  {item.type === 'switch' ? (
                    <Switch value={item.value as boolean} onValueChange={item.onChange}
                      trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
                  ) : item.value ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.rowValue}>{item.value}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#475569" style={{ marginLeft: 4 }} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#475569" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>MTAA OS v1.0.0</Text>
          <Text style={styles.footerSub}>© 2026 MTAA Technologies</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { alignItems: 'center', paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  email: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  signOutBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF444440' },
  signOutText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
  rowValue: { fontSize: 14, color: '#64748B' },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  footerSub: { color: '#334155', fontSize: 11, marginTop: 4 },
});