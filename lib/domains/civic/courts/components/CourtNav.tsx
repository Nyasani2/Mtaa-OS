// lib/domains/civic/courts/components/CourtNav.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/civic/courts' },
  { label: 'Cases', path: '/civic/courts/cases' },
  { label: 'Hearings', path: '/civic/courts/hearings' },
  { label: 'Staff', path: '/civic/courts/staff' },
  { label: 'Procurement', path: '/civic/courts/procurement' },
];

export function CourtNav() {
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
  nav: { flexDirection: 'row', padding: 8, backgroundColor: '#1a365d' },
  navItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4 },
  active: { backgroundColor: '#2c5282' },
  navText: { color: '#cbd5e0', fontSize: 12 },
  activeText: { color: '#fff', fontWeight: '600' },
});
