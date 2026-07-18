import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalInventory } from '@/lib/health/hooks/useHospitalInventory';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Package, Plus, AlertTriangle, Search, Filter, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react-native';

export default function HospitalInventoryScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const { items, alerts, addItem, updateStock, dispenseItem, loading } = useHospitalInventory(selectedFacilityId);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dispenseForm, setDispenseForm] = useState({ patient_id: '', quantity: '1', notes: '' });
  const [newItem, setNewItem] = useState({ name: '', category: 'medication', unit: 'bottle', unit_price: '', quantity: '', reorder_level: '10', supplier: '' });

  const filtered = items?.filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase())) || [];

  const handleAdd = async () => {
    if (!newItem.name || !newItem.unit_price || !newItem.quantity) { Alert.alert('Error', 'Name, price, and quantity required'); return; }
    await addItem({ ...newItem, unit_price: parseFloat(newItem.unit_price), quantity: parseFloat(newItem.quantity), reorder_level: parseFloat(newItem.reorder_level || '10') });
    setShowAdd(false);
    setNewItem({ name: '', category: 'medication', unit: 'bottle', unit_price: '', quantity: '', reorder_level: '10', supplier: '' });
  };

  const handleDispense = async () => {
    if (!selectedItem || !dispenseForm.patient_id) { Alert.alert('Error', 'Select item and enter patient ID'); return; }
    const result = await dispenseItem(selectedItem.id, parseFloat(dispenseForm.quantity), dispenseForm.patient_id, dispenseForm.notes);
    if (result.success) {
      Alert.alert('Dispensed', `Invoice #${result.invoice_id?.slice(0,8)} created for $${result.amount}`);
      setShowDispense(false);
      setDispenseForm({ patient_id: '', quantity: '1', notes: '' });
    } else { Alert.alert('Error', result.error); }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, item.quantity <= item.reorder_level ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#ECFDF5' }]}>
            <Package size={18} color={item.quantity <= item.reorder_level ? '#EF4444' : '#10B981'} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.category} · {item.unit} · ${item.unit_price}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.qtyText, item.quantity <= item.reorder_level && { color: '#EF4444' }]}>{item.quantity}</Text>
          <Text style={styles.qtyLabel}>in stock</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedItem(item); setShowDispense(true); }}>
          <ArrowUpRight size={14} color="#0A4DA6" /><Text style={styles.actionText}>Dispense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => updateStock(item.id, item.quantity + 10)}>
          <ArrowDownLeft size={14} color="#10B981" /><Text style={styles.actionText}>Restock +10</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}><Plus size={20} color="#fff" /></TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}><Search size={18} color="#9CA3AF" /><TextInput style={styles.searchInput} placeholder="Search items..." value={search} onChangeText={setSearch} /></View>
        <TouchableOpacity style={styles.filterBtn}><Filter size={18} color="#6B7280" /></TouchableOpacity>
      </View>
      {alerts?.length > 0 && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={16} color="#F59E0B" />
          <Text style={styles.alertText}>{alerts.length} items need attention</Text>
        </View>
      )}
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={i => i.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyText}>No items found</Text>} />
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalInner}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Add Inventory Item</Text><TouchableOpacity onPress={() => setShowAdd(false)}><X size={24} color="#1F2937" /></TouchableOpacity></View>
            <Text style={styles.label}>Name *</Text><TextInput style={styles.input} value={newItem.name} onChangeText={t => setNewItem({...newItem, name: t})} placeholder="Item name" />
            <Text style={styles.label}>Category</Text>
            <View style={styles.typeRow}>
              {['medication','equipment','supply','vaccine','traditional_herb'].map(c => (
                <TouchableOpacity key={c} style={[styles.typeChip, newItem.category === c && styles.typeChipActive]} onPress={() => setNewItem({...newItem, category: c})}>
                  <Text style={[styles.typeChipText, newItem.category === c && styles.typeChipTextActive]}>{c.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Unit Price ($) *</Text><TextInput style={styles.input} value={newItem.unit_price} onChangeText={t => setNewItem({...newItem, unit_price: t})} keyboardType="decimal-pad" placeholder="0.00" />
            <Text style={styles.label}>Quantity *</Text><TextInput style={styles.input} value={newItem.quantity} onChangeText={t => setNewItem({...newItem, quantity: t})} keyboardType="number-pad" placeholder="0" />
            <Text style={styles.label}>Reorder Level</Text><TextInput style={styles.input} value={newItem.reorder_level} onChangeText={t => setNewItem({...newItem, reorder_level: t})} keyboardType="number-pad" placeholder="10" />
            <Text style={styles.label}>Supplier</Text><TextInput style={styles.input} value={newItem.supplier} onChangeText={t => setNewItem({...newItem, supplier: t})} placeholder="Supplier name" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveText}>Add Item</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={showDispense} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Dispense {selectedItem?.name}</Text><TouchableOpacity onPress={() => setShowDispense(false)}><X size={24} color="#1F2937" /></TouchableOpacity></View>
            <Text style={styles.label}>Patient ID *</Text><TextInput style={styles.input} value={dispenseForm.patient_id} onChangeText={t => setDispenseForm({...dispenseForm, patient_id: t})} placeholder="Scan QR or enter ID" />
            <Text style={styles.label}>Quantity</Text><TextInput style={styles.input} value={dispenseForm.quantity} onChangeText={t => setDispenseForm({...dispenseForm, quantity: t})} keyboardType="number-pad" />
            <Text style={styles.label}>Notes</Text><TextInput style={[styles.input, styles.textArea]} value={dispenseForm.notes} onChangeText={t => setDispenseForm({...dispenseForm, notes: t})} multiline numberOfLines={2} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleDispense}><Text style={styles.saveText}>Dispense & Bill</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#0A4DA6', paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1F2937' },
  filterBtn: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', marginHorizontal: 12, padding: 10, borderRadius: 8, gap: 8 },
  alertText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardRight: { alignItems: 'center' },
  qtyText: { fontSize: 20, fontWeight: '800', color: '#0A4DA6' },
  qtyLabel: { fontSize: 10, color: '#9CA3AF' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', padding: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 40, flex: 1 },
  modalInner: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#1F2937' },
  textArea: { height: 60, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  typeChipActive: { backgroundColor: '#0A4DA6' },
  typeChipText: { fontSize: 12, color: '#6B7280' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#0A4DA6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
