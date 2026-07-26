import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ShopDashboard({ shopId }: { shopId: string }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Shop Dashboard</Text>
      <Text style={styles.subtitle}>Shop ID: {shopId}</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Sales</Text></View>
        <View style={styles.statBox}><Text style={styles.statNum}>$0</Text><Text style={styles.statLabel}>Revenue</Text></View>
        <View style={styles.statBox}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Orders</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#888', marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { color: '#00d4ff', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
});
