// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, useCashierPayments } from '@/lib/health/hooks/useCashier';
import { Alert, Feather } from '@expo/vector-icons';

export default function CashierPaymentsScreen() {
  const router = useRouter();
  const { invoice_id } = useLocalSearchParams();
  const { payments, invoices, loading, processPayment, refresh } = useCashierPayments();
  const [filter, setFilter] = useState<'all' | 'cash' | 'card' | 'wallet' | 'insurance'>('all');
  const [modalVisible, setModalVisible] = useState(!!invoice_id);
  const [form, setForm] = useState({
    invoice_id: (invoice_id as string) || '',
    amount: '',
    method: 'cash' as 'cash' | 'card' | 'wallet' | 'insurance',
    reference: '',
    notes: '',
  });

  const filtered = payments.filter((p: any) => {
    if (filter === 'all') return true;
    return p.method === filter;
  });

  const handlePayment = async () => {
    if (!form.invoice_id || !form.amount) {
      Alert.alert('Error', 'Invoice and amount are required');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    await processPayment({ ...form, amount });
    setModalVisible(false);
    setForm({ invoice_id: '', amount: '', method: 'cash', reference: '', notes: '' });
    refresh();
  };

  const methodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'dollar-sign';
      case 'card': return 'credit-card';
      case 'wallet': return 'smartphone';
      case 'insurance': return 'shield';
      default: return 'dollar-sign';
    }
  };

  const renderPayment = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.methodIcon}>
          <Feather name={methodIcon(item.method)} size={18} color="#2563eb" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardAmount}>${item.amount?.toLocaleString()}</Text>
          <Text style={styles.cardInvoice}>Invoice #{item.invoice?.invoice_number || item.invoice_id?.slice(0, 8)}</Text>
        </View>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      {item.reference && (
        <View style={styles.cardRow}>
          <Feather name="hash" size={14} color="#6b7280" />
          <Text style={styles.cardValue}>Ref: {item.reference}</Text>
        </View>
      )}
      {item.notes && (
        <View style={styles.cardRow}>
          <Feather name="file-text" size={14} color="#6b7280" />
          <Text style={styles.cardValue} numberOfLines={1}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Payments</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'cash', 'card', 'wallet', 'insurance'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading payments...</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPayment}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No {filter !== 'all' ? filter + ' ' : ''}payments found.</Text>}
        />
      )}

      {/* Process Payment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Process Payment</Text>

            <Text style={styles.label}>Invoice</Text>
            <TextInput
              style={styles.input}
              value={form.invoice_id}
              onChangeText={(t) => setForm({ ...form, invoice_id: t })}
              placeholder="Invoice ID"
            />

            <Text style={styles.label}>Amount ($)</Text>
            <TextInput
              style={styles.input}
              value={form.amount}
              onChangeText={(t) => setForm({ ...form, amount: t })}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodRow}>
              {(['cash', 'card', 'wallet', 'insurance'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodChip, form.method === m && styles.methodChipActive]}
                  onPress={() => setForm({ ...form, method: m })}
                >
                  <Feather name={methodIcon(m)} size={16} color={form.method === m ? '#fff' : '#6b7280'} />
                  <Text style={[styles.methodChipText, form.method === m && styles.methodChipTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Reference Number</Text>
            <TextInput
              style={styles.input}
              value={form.reference}
              onChangeText={(t) => setForm({ ...form, reference: t })}
              placeholder="Transaction reference..."
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={(t) => setForm({ ...form, notes: t })}
              placeholder="Additional notes..."
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handlePayment}>
                <Text style={styles.saveBtnText}>Process</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 12, color: '#6b7280' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  loading: { textAlign: 'center', marginTop: 40, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  methodIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  cardAmount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardInvoice: { fontSize: 13, color: '#6b7280' },
  cardDate: { fontSize: 12, color: '#9ca3af' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cardValue: { fontSize: 13, color: '#4b5563', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#f9fafb' },
  textArea: { height: 80, textAlignVertical: 'top' },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  methodChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  methodChipText: { fontSize: 13, color: '#4b5563' },
  methodChipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: '#6b7280', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
