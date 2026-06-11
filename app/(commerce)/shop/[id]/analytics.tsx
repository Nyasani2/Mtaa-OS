import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ShopAnalyticsScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Intelligence</Text>
        <Text style={styles.headerSub}>Powered by MTAA Pulse</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardIcon}>📊</Text>
        <Text style={styles.cardTitle}>Analytics Dashboard</Text>
        <Text style={styles.cardDesc}>Full business analytics are available in MTAA Pulse. View revenue trends, customer insights, demand signals, and growth opportunities.</Text>
        <TouchableOpacity style={styles.cardBtn} onPress={() => router.push(`/(os)/pulse?context=shop_${shopId}` as any)}>
          <Text style={styles.cardBtnText}>Open MTAA Pulse</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardIcon}>📈</Text>
        <Text style={styles.cardTitle}>Reports</Text>
        <Text style={styles.cardDesc}>Generate detailed reports for accounting, tax, inventory, and sales performance.</Text>
        <TouchableOpacity style={styles.cardBtn} onPress={() => router.push(`/(commerce)/shop/${shopId}/accounting` as any)}>
          <Text style={styles.cardBtnText}>View Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 20, marginTop: 0, padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardIcon: { fontSize: 40, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  cardBtn: { backgroundColor: '#2196F3', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  cardBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
