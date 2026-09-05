// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function ParentFees() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getParentConnections, getStudentFees } = useEducation();
  const [children, setChildren] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    const connections = await getParentConnections(user.id);
    const kids = connections?.map((c: any) => c.student) || [];
    setChildren(kids);

    const allFees = [];
    for (const child of kids) {
      const childFees = await getStudentFees(child.id);
      allFees.push(...(childFees || []).map((f: any) => ({ ...f, studentName: child.full_name })));
    }
    setFees(allFees);
    setLoading(false);
  };

  const handlePay = async (fee) => {
    Alert.alert(
      'Pay Fee',
      `Pay ${fee.currency} ${fee.amount} for ${fee.studentName} — ${fee.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              // Use wallet service directly instead of store hook
              const { paySchoolFee } = await import('@/lib/services/wallet-service');
              await paySchoolFee({
                institutionId: fee.institution_id,
                amount: fee.amount,
                currency: fee.currency,
                description: `School fee: ${fee.description}`,
                studentId: fee.student_id,
              });
              Alert.alert('Success', 'Payment completed');
              loadData();
            } catch (e) {
              Alert.alert('Error', e.message || 'Payment failed');
            }
          },
        },
      ]
    );
  };

  const totalDue = fees.filter((f: any) => f.status === 'pending').reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Fees</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Due</Text>
        <Text style={styles.balanceAmount}>KSh {totalDue.toLocaleString()}</Text>
        <Text style={styles.balanceSub}>Tap Pay Now on any pending fee to pay</Text>
      </View>

      <ScrollView>
        {fees.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No fee records</Text>
          </View>
        ) : (
          fees.map((fee: any) => (
            <View key={fee.id} style={styles.feeCard}>
              <View style={styles.feeHeader}>
                <View>
                  <Text style={styles.feeTitle}>{fee.description}</Text>
                  <Text style={styles.feeStudent}>{fee.studentName} • {fee.institution?.name}</Text>
                </View>
                <StatusBadge status={fee.status} />
              </View>
              <View style={styles.feeFooter}>
                <Text style={styles.feeAmount}>{fee.currency} {fee.amount?.toLocaleString()}</Text>
                <Text style={styles.feeDue}>Due: {formatDate(fee.due_date)}</Text>
              </View>
              {fee.status === 'pending' && (
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(fee)}>
                  <Ionicons name="card-outline" size={16} color="#fff" />
                  <Text style={styles.payBtnText}>Pay Now</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: { bg: '#fef3c7', text: '#d97706' },
    paid: { bg: '#d1fae5', text: '#059669' },
    overdue: { bg: '#fee2e2', text: '#dc2626' },
    waived: { bg: '#e0e7ff', text: '#6366f1' },
  };
  const c = colors[status] || colors.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status?.toUpperCase()}</Text>
    </View>
  );
}

function formatDate(date) {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  balanceCard: { backgroundColor: '#8b5cf6', margin: 16, borderRadius: 16, padding: 20 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
  balanceSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  feeCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  feeTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  feeStudent: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  feeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feeAmount: { fontSize: 18, fontWeight: '700', color: '#111827' },
  feeDue: { fontSize: 12, color: '#6b7280' },
  payBtn: { backgroundColor: '#8b5cf6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  payBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#9ca3af', marginTop: 16, fontSize: 16 },
});

