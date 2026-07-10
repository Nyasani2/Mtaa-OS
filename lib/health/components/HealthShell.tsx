// lib/health/components/HealthShell.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/health' },
  { label: 'Patients', path: '/health/patients' },
  { label: 'Appointments', path: '/health/appointments' },
  { label: 'Records', path: '/health/records' },
];

export function HealthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.path}
            style={[styles.navItem, pathname === item.path && styles.active]}
            onPress={() => router.push(item.path)}
          >
            <Text style={[styles.navText, pathname === item.path && styles.activeText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', padding: 8, backgroundColor: '#065f46' },
  navItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4 },
  active: { backgroundColor: '#047857' },
  navText: { color: '#a7f3d0', fontSize: 12 },
  activeText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
});

