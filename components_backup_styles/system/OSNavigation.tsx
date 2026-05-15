/**
 * MTAA OS — ONE Consolidated Navigation (React Native)
 * NO old dashboard nav. NO duplicated tabs. NO disconnected launchers.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { path: '/(os)/home', label: 'Home', icon: '⌂' },
  { path: '/(os)/launcher', label: 'Apps', icon: '◈' },
  { path: '/wallet', label: 'Wallet', icon: '◉' },
  { path: '/messages', label: 'Messages', icon: '✉' },
  { path: '/profile', label: 'Profile', icon: '◐' },
];

export function OSNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path)}
              style={styles.btn}
              activeOpacity={0.7}
            >
              <Text style={[styles.icon, isActive && styles.iconActive]}>{item.icon}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingBottom: 20, paddingTop: 8 },
  inner: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', maxWidth: 500, alignSelf: 'center', width: '100%' },
  btn: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 },
  icon: { fontSize: 20, color: 'rgba(255,255,255,0.5)' },
  iconActive: { color: '#60a5fa' },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  labelActive: { color: '#60a5fa', fontWeight: '600' },
});
