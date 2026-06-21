// app/(os)/settings/index.tsx — MTAA OS Settings
// v3.1: Uses unified useAuth with full_name, username, etc.

import { useState } from 'react';
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

  const displayName = user?.full_name || user?.display_name || user?.username || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'Not signed in';

  const sections = [
    {
      title: 'PREFERENCES',
      items: [
        { icon: 'moon-outline', label: 'Dark Mode', type: 'switch', value: darkMode, onChange: setDarkMode },
        { icon: 'notifications-outline', label: 'Notifications', type: 'switch', value: notifications, onChange: setNotifications },
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
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>MTAA OS v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  email: { fontSize: 14, color: '#888', marginTop: 4 },
  signOutBtn: { marginTop: 12, backgroundColor: '#fee2e2', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  signOutText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginHorizontal: 20, marginBottom: 8 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, fontSize: 15, marginLeft: 12, color: '#333', fontWeight: '500' },
  version: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginVertical: 24 },
});
