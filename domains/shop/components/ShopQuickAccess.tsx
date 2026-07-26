import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const QUICK_ACTIONS = [
  { label: 'Browse', icon: 'search', route: '/shop/browse' },
  { label: 'My Shop', icon: 'storefront', route: '/shop/create' },
  { label: 'Orders', icon: 'cart', route: '/shop/orders' },
  { label: 'Wallet', icon: 'wallet', route: '/wallet' },
];

export default function ShopQuickAccess() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Access</Text>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity key={a.label} style={styles.tile} onPress={() => router.push(a.route as any)}>
            <Ionicons name={a.icon as any} size={24} color="#00d4ff" />
            <Text style={styles.label}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '23%', aspectRatio: 1, backgroundColor: '#1a1a1a', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#aaa', fontSize: 11, marginTop: 6 },
});
