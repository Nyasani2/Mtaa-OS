import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ShopCartScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(commerce)/shop/browse' as any)}>
          <Text style={styles.browseBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#64748B', marginBottom: 20 },
  browseBtn: { backgroundColor: '#2196F3', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
