// lib/civic/prisons/components/PrisonNav.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/civic/prisons' },
  { label: 'Inmates', path: '/civic/prisons/inmates' },
  { label: 'Cells', path: '/civic/prisons/cells' },
  { label: 'Movements', path: '/civic/prisons/movements' },
  { label: 'Staff', path: '/civic/prisons/staff' },
];

export function PrisonNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
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
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', padding: 8, backgroundColor: '#1a1a1a' },
  navItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4 },
  active: { backgroundColor: '#333' },
  navText: { color: '#ccc', fontSize: 12 },
  activeText: { color: '#fff', fontWeight: '600' },
});
