// app/(os)/settings/index.tsx — MTAA OS Settings
// v3.2: Added Network & Internet section

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [networkType, setNetworkType] = useState('Unknown');

  const displayName = user?.full_name || user?.display_name || user?.username || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'Not signed in';

  // Read network state on mount
  useEffect(() => {
    async function checkNetwork() {
      try {
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

  const sections = [
    {
      title: 'PREFERENCES',
      items: [
        { icon: 'moon-outline', label: 'Dark Mode', type: 'switch', value: darkMode, onChange: setDarkMode },
        { icon: 'notifications-outline', label: 'Notifications', type: 'switch', value: notifications, onChange: setNotifications },
      ],
    },
    {
      title: 'NETWORK & INTERNET',
      items: [
        { icon: 'wifi-outline', label: 'Network & Internet', type: 'link', route: '/(os)/settings/network', value: networkType },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { icon: 'person-outline', label: 'Profile', type: 'link', route: '/(os)/profile' },
        { icon: 'wallet-outline', label: 'Wallet', type: 'link', route: '/(os)/wallet' },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { icon: 'keypad-outline', label: 'Change PIN', type: 'link', route: '/(os)/settings/change-pin' },
        { icon: 'finger-print-outline', label: 'Biometric Login', type: 'link', route: '/(os)/settings/biometric' },
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
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          {isAuthenticated && (
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
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
                  onPress={() => item.type === 'link' && router.push(item.route as any)}
                  activeOpacity={item.type === 'switch' ? 1 : 0.7}
                >
                  <Ionicons name={item.icon as any} size={22} color="#6366f1" />
                  <Text style={styles.rowText}>{item.label}</Text>
                  {item.type === 'switch' ? (
                    <Switch value={item.value as boolean} onValueChange={item.onChange as any}
                      trackColor={{ false: '#e2e8f0', true: '#6366f1' }} />
                  ) : item.value ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.rowValue}>{item.value}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#999" style={{ marginLeft: 4 }} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  email: { fontSize: 14, color: '#64748b', marginTop: 4 },
  signOutBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fee2e2' },
  signOutText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, fontSize: 16, color: '#1e293b', marginLeft: 12 },
  rowValue: { fontSize: 14, color: '#64748b' },
});
