// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DriverEarningsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>My Earnings</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Balance</Text>
        <Text style={styles.summaryValue}>KES 45,200</Text>
        <TouchableOpacity style={styles.withdrawBtn}>
          <Text style={styles.withdrawText}>Withdraw to Wallet</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        <StatBox label="Today" value="1,500" color="#3b82f6" />
        <StatBox label="This Week" value="8,500" color="#10b981" />
        <StatBox label="This Month" value="32,000" color="#f59e0b" />
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, color }: any) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>KES {value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  summaryCard: { backgroundColor: '#1e293b', margin: 20, padding: 24, borderRadius: 16, alignItems: 'center' },
  summaryLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 16 },
  withdrawBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  withdrawText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  statLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
