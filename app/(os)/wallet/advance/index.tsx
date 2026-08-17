import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdvanceHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.simulationBanner}>
        <Text style={styles.simulationText}>⚠️ SIMULATION MODE</Text>
        <Text style={styles.simulationSubtext}>No real lending. Build only.</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>MTAA Advance</Text>
      </View>

      <View style={styles.eligibilityCard}>
        <Text style={styles.eligibilityTitle}>Your Eligibility</Text>
        <View style={styles.limitRow}>
          <View style={styles.limitItem}>
            <Text style={styles.limitValue}>KSh 25,000</Text>
            <Text style={styles.limitLabel}>Approved Limit</Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={styles.limitValue}>KSh 25,000</Text>
            <Text style={styles.limitLabel}>Available</Text>
          </View>
        </View>
        <View style={styles.rateRow}>
          <Text style={styles.rateText}>Interest Rate: 10% per month</Text>
          <Text style={styles.rateText}>Grace Period: 30 days</Text>
        </View>
      </View>

      <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Advance History</Text>

        {[
          { id: '1', amount: 5000, status: 'repaid', date: '2026-05-15', repaid: 5500 },
          { id: '2', amount: 10000, status: 'repaying', date: '2026-06-01', repaid: 3000, due: '2026-07-01' },
        ].map((advance) => (
          <View key={advance.id} style={styles.advanceItem}>
            <View style={styles.advanceHeader}>
              <Text style={styles.advanceAmount}>KSh {advance.amount.toLocaleString()}</Text>
              <Text style={[styles.advanceStatus, advance.status === 'repaid' ? styles.statusRepaid : styles.statusRepaying]}>
                {advance.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.advanceDate}>Requested: {advance.date}</Text>
            {advance.status === 'repaying' && (
              <View style={styles.repaymentProgress}>
                <View style={styles.repaymentBar}>
                  <View style={[styles.repaymentFill, { width: `${(advance.repaid / (advance.amount * 1.1)) * 100}%` }]} />
                </View>
                <Text style={styles.repaymentText}>KSh {advance.repaid.toLocaleString()} repaid</Text>
                <Text style={styles.dueText}>Due: {advance.due}</Text>
              </View>
            )}
            {advance.status === 'repaid' && (
              <Text style={styles.repaidText}>Total repaid: KSh {advance.repaid.toLocaleString()}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.requestButton} onPress={() => router.push('/(os)/wallet/advance/request')}>
          <Text style={styles.requestButtonText}>Request Advance</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  simulationBanner: { backgroundColor: '#FF444420', paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FF444440' },
  simulationText: { color: '#FF4444', fontSize: 14, fontWeight: '700' },
  simulationSubtext: { color: '#FF444480', fontSize: 12, marginTop: 2 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  eligibilityCard: { backgroundColor: '#1A1A1A', marginHorizontal: 24, padding: 20, borderRadius: 16, marginBottom: 24 },
  eligibilityTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  limitRow: { flexDirection: 'row', marginBottom: 16 },
  limitItem: { flex: 1 },
  limitValue: { color: '#00D68F', fontSize: 20, fontWeight: '700' },
  limitLabel: { color: '#888888', fontSize: 12, marginTop: 4 },
  rateRow: { borderTopWidth: 1, borderTopColor: '#333333', paddingTop: 12 },
  rateText: { color: '#888888', fontSize: 12 },
  historyList: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  advanceItem: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, marginBottom: 12 },
  advanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  advanceAmount: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  advanceStatus: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusRepaid: { color: '#00D68F', backgroundColor: '#00D68F20' },
  statusRepaying: { color: '#FFD700', backgroundColor: '#FFD70020' },
  advanceDate: { color: '#888888', fontSize: 12, marginBottom: 8 },
  repaymentProgress: { marginTop: 8 },
  repaymentBar: { height: 6, backgroundColor: '#333333', borderRadius: 3, marginBottom: 8 },
  repaymentFill: { height: 6, backgroundColor: '#FFD700', borderRadius: 3 },
  repaymentText: { color: '#FFFFFF', fontSize: 12 },
  dueText: { color: '#FF4444', fontSize: 12, marginTop: 4 },
  repaidText: { color: '#00D68F', fontSize: 12, marginTop: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  requestButton: { backgroundColor: '#00D68F', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  requestButtonText: { color: '#0A0A0A', fontSize: 16, fontWeight: '700' },
});

