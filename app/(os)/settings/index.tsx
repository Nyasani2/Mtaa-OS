// app/(os)/settings/index.tsx — Settings Home
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIdentity } from '@/hooks/useAuthStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useIdentity();

  const settings = [
    { icon: 'person', label: 'Profile', route: '/settings/profile' as any },
    { icon: 'notifications', label: 'Notifications', route: '/settings/notifications' as any },
    { icon: 'lock-closed', label: 'Security & PIN', route: '/settings/pin' as any },
    { icon: 'moon', label: 'Display', route: '/settings/display' as any },
    { icon: 'shield-checkmark', label: 'Privacy', route: '/settings/security' as any },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.email?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.email}>{user?.email || 'Guest'}</Text>
            <Text style={styles.role}>User</Text>
          </View>
        </View>

        {settings.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            onPress={() => router.push(item.route)}
          >
            <Ionicons name={item.icon as any} size={22} color="#94A3B8" />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  email: { color: '#fff', fontSize: 16, fontWeight: '600' },
  role: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  rowLabel: { color: '#fff', fontSize: 15, flex: 1, marginLeft: 12 },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: '#EF444420',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
