import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GovernmentHubScreen() {
  const router = useRouter();

  const ledgers = [
    { country: 'Kenya', code: 'KE', balance: 24500000, currency: 'KES', lastSettlement: '2026-05-30' },
    { country: 'Uganda', code: 'UG', balance: 8900000, currency: 'UGX', lastSettlement: '2026-05-28' },
    { country: 'Ghana', code: 'GH', balance: 12000000, currency: 'GHS', lastSettlement: '2026-05-25' },
  ];

  const stats = [
    { label: 'Total Tax Collected', value: 'KSh 45.4M', change: '+12%' },
    { label: 'Active Merchants', value: '12,450', change: '+8%' },
    { label: 'Monthly Transactions', value: '284,000', change: '+15%' },
    { label: 'Compliance Rate', value: '98.5%', change: '+2%' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Government Hub</Text>
        <Text style={styles.subtitle}>Revenue & Compliance Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statChange}>{stat.change}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.ledgersList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Government Custody Ledgers</Text>

        {ledgers.map((ledger) => (
          <View key={ledger.code} style={styles.ledgerCard}>
            <View style={styles.ledgerHeader}>
              <Text style={styles.ledgerCountry}>{ledger.country}</Text>
              <Text style={styles.ledgerCode}>{ledger.code}</Text>
            </View>
            <Text style={styles.ledgerBalance}>
              {ledger.currency} {ledger.balance.toLocaleString()}
            </Text>
            <Text style={styles.ledgerSettlement}>Last Settlement: {ledger.lastSettlement}</Text>
            <TouchableOpacity style={styles.settlementButton}>
              <Text style={styles.settlementButtonText}>Request Settlement</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/(os)/wallet/gov-portal')}>
          <Text style={styles.reportButtonText}>View Full Reports</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { color: '#888888', fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12 },
  statValue: { color: '#00D68F', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888888', fontSize: 12, marginTop: 4 },
  statChange: { color: '#00D68F', fontSize: 12, marginTop: 4, fontWeight: '600' },
  ledgersList: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  ledgerCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, marginBottom: 12 },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ledgerCountry: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  ledgerCode: { color: '#888888', fontSize: 14 },
  ledgerBalance: { color: '#00D68F', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  ledgerSettlement: { color: '#888888', fontSize: 12, marginBottom: 12 },
  settlementButton: { backgroundColor: '#333333', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  settlementButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  reportButton: { backgroundColor: '#00D68F', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  reportButtonText: { color: '#0A0A0A', fontSize: 16, fontWeight: '700' },
});

