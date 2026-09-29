// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MTruckEarningsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Fleet Earnings</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Available for Withdrawal</Text>
        <Text style={styles.summaryValue}>KES 125,000</Text>
        <TouchableOpacity style={styles.withdrawBtn}>
          <Text style={styles.withdrawText}>Request Settlement</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Hauls</Text>
        <View style={styles.haulCard}>
          <View style={styles.haulRow}>
            <Text style={styles.haulRoute}>Nairobi → Mombasa</Text>
            <Text style={styles.haulAmount}>KES 45,000</Text>
          </View>
          <Text style={styles.haulDate}>Completed: Oct 24, 2023</Text>
          <View style={styles.haulStatus}>
            <Text style={styles.statusText}>Settled</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  summaryCard: { backgroundColor: '#1e293b', margin: 20, padding: 24, borderRadius: 16, alignItems: 'center' },
  summaryLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 16 },
  withdrawBtn: { backgroundColor: '#84cc16', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  withdrawText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  section: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  haulCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 },
  haulRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  haulRoute: { color: '#fff', fontSize: 16, fontWeight: '700' },
  haulAmount: { color: '#84cc16', fontSize: 16, fontWeight: '700' },
  haulDate: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  haulStatus: { backgroundColor: '#84cc1620', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { color: '#84cc16', fontSize: 12, fontWeight: '600' },
});
