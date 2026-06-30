import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FeesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<any[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setFees([
        { id: '1', student_name: 'John Doe', grade: 'Form 3', amount: 25000, paid: 15000, balance: 10000, term: 'Term 2', status: 'partial' },
        { id: '2', student_name: 'Jane Smith', grade: 'Form 2', amount: 25000, paid: 25000, balance: 0, term: 'Term 2', status: 'paid' },
        { id: '3', student_name: 'Peter Ochieng', grade: 'Form 4', amount: 28000, paid: 0, balance: 28000, term: 'Term 2', status: 'unpaid' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: string) => { switch(status) { case 'paid': return '#10b981'; case 'partial': return '#f59e0b'; case 'unpaid': return '#ef4444'; default: return '#94a3b8'; } };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Fee Structure</Text>
        <TouchableOpacity><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#10b98115' }]}>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>KES 75K</Text>
          <Text style={styles.summaryLabel}>Total Collected</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ef444415' }]}>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>KES 38K</Text>
          <Text style={styles.summaryLabel}>Outstanding</Text>
        </View>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" /> : (
        <ScrollView style={styles.content}>
          {fees.map((fee) => (
            <View key={fee.id} style={styles.feeCard}>
              <View style={styles.feeHeader}>
                <View><Text style={styles.feeName}>{fee.student_name}</Text><Text style={styles.feeGrade}>{fee.grade} · {fee.term}</Text></View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(fee.status) }]}>{fee.status}</Text>
                </View>
              </View>
              <View style={styles.feeDetails}>
                <View style={styles.feeItem}><Text style={styles.feeLabel}>Amount</Text><Text style={styles.feeValue}>KES {fee.amount.toLocaleString()}</Text></View>
                <View style={styles.feeItem}><Text style={styles.feeLabel}>Paid</Text><Text style={[styles.feeValue, { color: '#10b981' }]}>KES {fee.paid.toLocaleString()}</Text></View>
                <View style={styles.feeItem}><Text style={styles.feeLabel}>Balance</Text><Text style={[styles.feeValue, { color: '#ef4444' }]}>KES {fee.balance.toLocaleString()}</Text></View>
              </View>
              <TouchableOpacity style={styles.payBtn} onPress={() => Alert.alert('Pay Fee', 'Wallet integration coming soon')}>
                <Text style={styles.payBtnText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  content: { paddingHorizontal: 16 },
  feeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  feeName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  feeGrade: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  feeDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  feeItem: { alignItems: 'center' },
  feeLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 2 },
  feeValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  payBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  payBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
