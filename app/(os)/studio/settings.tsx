import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, Lock, Globe, Moon, HelpCircle, LogOut } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioSettings() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  const items = [
    { icon: Bell, label: 'Notifications', value: notifications, toggle: setNotifications },
    { icon: Moon, label: 'Dark Mode', value: darkMode, toggle: setDarkMode },
    { icon: Lock, label: 'Privacy & Security', action: () => router.push('/(os)/settings/privacy' as any) },
    { icon: Globe, label: 'Language', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Studio Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        {items.map((item, i) => (
          <Pressable key={i}
            onPress={item.action || (() => item.toggle?.(!item.value))}
            style={[styles.row, i < items.length - 1 && styles.rowBorder]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconBox}>
                <item.icon size={18} color="#fff" />
              </View>
              <Text style={styles.label}>{item.label}</Text>
            </View>
            {item.toggle ? (
              <Switch value={item.value} onValueChange={item.toggle}
                trackColor={{ false: '#333', true: '#dc143c' }} thumbColor="#fff" />
            ) : (
              <Text style={{ color: '#888', fontSize: 18 }}>›</Text>
            )}
          </Pressable>
        ))}
      </View>

      <Pressable onPress={logout} style={styles.logoutBtn}>
        <LogOut size={18} color="#ff4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { backgroundColor: '#1a1a1a', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2a2a2a',
    justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  label: { color: '#fff', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 24, backgroundColor: 'rgba(255,68,68,0.1)',
    padding: 14, borderRadius: 12, gap: 8 },
  logoutText: { color: '#ff4444', fontSize: 15, fontWeight: '600' },
});
