// app/(os)/wallet/business.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useBusiness } from '@/domains/business/hooks/useBusiness';
import { usePayments } from '@/domains/business/hooks/usePayments';
import { businessService, TillPayment, PaybillPayment } from '@/domains/business/services/businessService';

export default function BusinessScreen() {
  const router = useRouter();
  const { business, loading: bizLoading } = useBusiness();
  const { payments, loading: payLoading, refresh } = usePayments(business?.id);
  const [exporting, setExporting] = useState(false);

  const initiateTill = async (tillNumber: string | undefined, phone: string, amount: number) => {
    if (!tillNumber) {
      Alert.alert('Error', 'No till number configured');
      return;
    }
    // Call STK push edge function
    try {
      const response = await fetch('/api/business-stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tillNumber, phone, amount }),
      });
      if (!response.ok) throw new Error('STK push failed');
      Alert.alert('Success', 'Payment request sent to customer phone');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const exportCSV = () => {
    if (!payments.length) return;
    setExporting(true);
    const allPayments = payments as (TillPayment | PaybillPayment)[];
    const csv = allPayments.map((p: TillPayment | PaybillPayment) => {
      const number = 'till_number' in p ? p.till_number : p.paybill_number;
      return `${p.created_at},${number},${p.sender_name || p.sender_phone},${p.amount},${p.status}`;
    }).join('\n');

    // In native, share via Share API
    console.log('CSV Export:', csv);
    Alert.alert('Export', 'CSV generated (check console for data)');
    setExporting(false);
  };

  if (bizLoading) return <View style={styles.center}><Text>Loading...</Text></View>;

  if (!business) {
    return (
      <View style={styles.center}>
        <Text style={styles.noBizText}>No business registered</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(os)/wallet/business-register')}>
          <Text style={styles.buttonText}>Register Business</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{business.name}</Text>
      <Text style={styles.status}>Status: {business.status}</Text>

      {business.till_number && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Till Number: {business.till_number}</Text>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => initiateTill(business.till_number, '254712345678', 1)}
          >
            <Text style={styles.actionText}>Test STK Push</Text>
          </TouchableOpacity>
        </View>
      )}

      {business.paybill_number && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paybill: {business.paybill_number}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payments ({payments.length})</Text>
        {payLoading ? <Text>Loading payments...</Text> : (
          payments.map((p, i) => (
            <View key={i} style={styles.paymentRow}>
              <Text style={styles.paymentAmount}>KES {p.amount}</Text>
              <Text style={[styles.paymentStatus, p.status === 'completed' ? styles.completed : styles.pending]}>
                {p.status}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={exportCSV} disabled={exporting}>
        <Text style={styles.buttonText}>{exporting ? 'Exporting...' : 'Export CSV'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={refresh}>
        <Text style={[styles.buttonText, styles.secondaryText]}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  status: { fontSize: 14, color: '#666', marginBottom: 20 },
  noBizText: { fontSize: 18, color: '#666', marginBottom: 20 },
  section: { marginBottom: 20, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 6, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '600' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  paymentAmount: { fontSize: 16, fontWeight: '600' },
  paymentStatus: { fontSize: 14 },
  completed: { color: '#059669' },
  pending: { color: '#d97706' },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: { backgroundColor: '#f3f4f6' },
  secondaryText: { color: '#374151' },
});
