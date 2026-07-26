import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCashierInvoices } from '@/lib/health/hooks/useCashier';
import { Feather } from '@expo/vector-icons';

export default function CashierInvoicesScreen() {
  const router = useRouter();
  const { invoices, loading, createInvoice, refresh } = useCashierInvoices();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    items: [] as any[],
    due_date: '',
    notes: '',
  });
  const [newItem, setNewItem] = useState({ description: '', quantity: '1', unit_price: '' });

  const filtered = invoices.filter((inv: any) => {
    if (filter === 'unpaid') return inv.status === 'unpaid';
    if (filter === 'paid') return inv.status === 'paid';
    if (filter === 'overdue') return inv.status === 'unpaid' && new Date(inv.due_date) < new Date();
    return true;
  });

  const addItem = () => {
    if (!newItem.description || !newItem.unit_price) return;
    const qty = parseInt(newItem.quantity) || 1;
    const price = parseFloat(newItem.unit_price);
    setForm({
      ...form,
      items: [...form.items, { ...newItem, quantity: qty, unit_price: price, total: qty * price }],
    });
    setNewItem({ description: '', quantity: '1', unit_price: '' });
  };

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const totalAmount = form.items.reduce((sum, item) => sum + item.total, 0);

  const handleCreate = async () => {
    if (!form.patient_id || form.items.length === 0) {
      Alert.alert('Error', 'Patient and at least one item are required');
      return;
    }
    await createInvoice({ ...form, total_amount: totalAmount });
    setModalVisible(false);
    setForm({ patient_id: '', items: [], due_date: '', notes: '' });
    refresh();
  };

  const statusColor = (status: string, dueDate?: string) => {
    if (status === 'paid') return { bg: '#d1fae5', text: '#059669' };
    if (status === 'unpaid' && dueDate && new Date(dueDate) < new Date()) return { bg: '#fee2e2', text: '#dc2626' };
    if (status === 'unpaid') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#f3f4f6', text: '#6b7280' };
  };

  const renderInvoice = ({ item }: { item: any }) => {
    const colors = statusColor(item.status, item.due_date);
    const isOverdue = item.status === 'unpaid' && item.due_date && new Date(item.due_date) < new Date();
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/health/cashier/invoices/${item.id}`)}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardId}>Invoice #{item.invoice_number || item.id.slice(0, 8)}</Text>
            <Text style={styles.cardPatient}>{item.patient?.full_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {isOverdue ? 'OVERDUE' : item.status}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Feather name="dollar-sign" size={14} color="#6b7280" />
            <Text style={styles.cardValue}>${item.total_amount?.toLocaleString()}</Text>
          </View>
          <View style={styles.cardRow}>
            <Feather name="calendar" size={14} color="#6b7280" />
            <Text style={styles.cardValue}>Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Feather name="list" size={14} color="#6b7280" />
            <Text style={styles.cardValue}>{item.items?.length || 0} items</Text>
          </View>
        </View>
        {item.status === 'unpaid' && (
          <TouchableOpacity style={styles.payBtn} onPress={() => router.push(`/health/cashier/payments/new?invoice_id=${item.id}`)}>
            <Text style={styles.payBtnText}>Process Payment</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'unpaid', 'paid', 'overdue'] as const).map((f) => (
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
        <Text style={styles.loading}>Loading invoices...</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderInvoice}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No {filter} invoices found.</Text>}
        />
      )}

      {/* Create Invoice Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Invoice</Text>

            <Text style={styles.label}>Patient</Text>
            {/* Patient picker would go here - simplified for brevity */}
            <TextInput
              style={styles.input}
              value={form.patient_id}
              onChangeText={(t) => setForm({ ...form, patient_id: t })}
              placeholder="Patient ID"
            />

            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={form.due_date}
              onChangeText={(t) => setForm({ ...form, due_date: t })}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Items</Text>
            {form.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText}>{item.description} x{item.quantity} = ${item.total}</Text>
                <TouchableOpacity onPress={() => removeItem(idx)}>
                  <Feather name="trash-2" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                value={newItem.description}
                onChangeText={(t) => setNewItem({ ...newItem, description: t })}
                placeholder="Description"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newItem.quantity}
                onChangeText={(t) => setNewItem({ ...newItem, quantity: t })}
                placeholder="Qty"
                keyboardType="number-pad"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newItem.unit_price}
                onChangeText={(t) => setNewItem({ ...newItem, unit_price: t })}
                placeholder="Price"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <Feather name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.totalText}>Total: ${totalAmount.toLocaleString()}</Text>

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
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>Create Invoice</Text>
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
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 13, color: '#6b7280' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  loading: { textAlign: 'center', marginTop: 40, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardId: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardPatient: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { gap: 6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardValue: { fontSize: 13, color: '#4b5563', flex: 1 },
  payBtn: { marginTop: 12, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#f9fafb' },
  textArea: { height: 80, textAlignVertical: 'top' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemText: { fontSize: 14, color: '#374151' },
  addItemRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  addItemBtn: { backgroundColor: '#2563eb', width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  totalText: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12, textAlign: 'right' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: '#6b7280', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
