import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ShopOrdersBuyerScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySub}>Orders appear here after you make a purchase</Text>
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
  emptyText: { fontSize: 16, color: '#64748B' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
});
