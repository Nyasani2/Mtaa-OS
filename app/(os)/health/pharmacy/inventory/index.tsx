
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { usePharmacy } from '@/lib/health/hooks/usePharmacy';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Package, Plus, Search, X, AlertTriangle, TrendingDown, Edit3, Trash2, Pill } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function PharmacyInventoryScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({ name: '', generic_name: '', category: 'tablet', strength: '', quantity: '', unit: 'pcs', reorder_level: '', supplier_id: '', price: '', expiry_date: '' });
  const { inventory, suppliers, loading, error, refresh, addInventoryItem, updateInventoryItem, deleteInventoryItem } = usePharmacy(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredInventory = inventory?.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.generic_name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
  });

  const handleSave = useCallback(async () => {
    if (!itemForm.name.trim() || !itemForm.quantity) { Alert.alert('Error', 'Name and quantity are required'); return; }
    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id, { ...itemForm, facility_id: selectedFacilityId });
        Alert.alert('Success', 'Item updated');
      } else {
        await addInventoryItem({ ...itemForm, facility_id: selectedFacilityId });
        Alert.alert('Success', 'Item added');
      }
      setShowAddModal(false);
      setEditingItem(null);
      setItemForm({ name: '', generic_name: '', category: 'tablet', strength: '', quantity: '', unit: 'pcs', reorder_level: '', supplier_id: '', price: '', expiry_date: '' });
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to save item'); }
  }, [itemForm, editingItem, selectedFacilityId, addInventoryItem, updateInventoryItem]);

  const handleEdit = useCallback((item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || '', generic_name: item.generic_name || '', category: item.category || 'tablet',
      strength: item.strength || '', quantity: String(item.quantity || ''), unit: item.unit || 'pcs',
      reorder_level: String(item.reorder_level || ''), supplier_id: item.supplier_id || '',
      price: String(item.price || ''), expiry_date: item.expiry_date || ''
    });
    setShowAddModal(true);
  }, []);

  const handleDelete = useCallback((itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteInventoryItem(itemId); Alert.alert('Success', 'Item deleted'); }
        catch (err: any) { Alert.alert('Error', err.message || 'Failed to delete'); }
      }}
    ]);
  }, [deleteInventoryItem]);

  const getStockStatus = (qty: number, reorder: number) => {
    if (qty <= 0) return { color: COLORS.danger, label: 'Out of Stock' };
    if (qty <= reorder) return { color: COLORS.warning, label: 'Low Stock' };
    return { color: COLORS.success, label: 'In Stock' };
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingItem(null); setItemForm({ name: '', generic_name: '', category: 'tablet', strength: '', quantity: '', unit: 'pcs', reorder_level: '', supplier_id: '', price: '', expiry_date: '' }); setShowAddModal(true); }}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search inventory..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredInventory?.length === 0 ? (
          <View style={styles.emptyState}><Package size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No items match' : 'No inventory items yet'}</Text></View>
        ) : (
          filteredInventory?.map((item: any) => {
            const status = getStockStatus(item.quantity, item.reorder_level);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Pill size={20} color={status.color} />
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemGeneric}>{item.generic_name} {item.strength}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Stock</Text>
                    <Text style={styles.detailValue}>{item.quantity} {item.unit}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Reorder</Text>
                    <Text style={styles.detailValue}>{item.reorder_level}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.detailValue}>${item.price || 0}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Expires</Text>
                    <Text style={[styles.detailValue, item.expiry_date && new Date(item.expiry_date) < new Date(Date.now() + 30*24*60*60*1000) && { color: COLORS.danger }]}>
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                    <Edit3 size={16} color={COLORS.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Trash2 size={16} color={COLORS.danger} />
                    <Text style={[styles.actionText, { color: COLORS.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Paracetamol" value={itemForm.name} onChangeText={(t) => setItemForm({ ...itemForm, name: t })} />
              <Text style={styles.inputLabel}>Generic Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Acetaminophen" value={itemForm.generic_name} onChangeText={(t) => setItemForm({ ...itemForm, generic_name: t })} />
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler'].map((c) => (
                  <TouchableOpacity key={c} style={[styles.categoryChip, itemForm.category === c && styles.categoryChipActive]} onPress={() => setItemForm({ ...itemForm, category: c })}>
                    <Text style={[styles.categoryText, itemForm.category === c && styles.categoryTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Strength</Text>
              <TextInput style={styles.input} placeholder="e.g. 500mg" value={itemForm.strength} onChangeText={(t) => setItemForm({ ...itemForm, strength: t })} />
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput style={styles.input} placeholder="100" value={itemForm.quantity} onChangeText={(t) => setItemForm({ ...itemForm, quantity: t })} keyboardType="number-pad" />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput style={styles.input} placeholder="pcs" value={itemForm.unit} onChangeText={(t) => setItemForm({ ...itemForm, unit: t })} />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Reorder Level</Text>
                  <TextInput style={styles.input} placeholder="20" value={itemForm.reorder_level} onChangeText={(t) => setItemForm({ ...itemForm, reorder_level: t })} keyboardType="number-pad" />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Price ($)</Text>
                  <TextInput style={styles.input} placeholder="5.00" value={itemForm.price} onChangeText={(t) => setItemForm({ ...itemForm, price: t })} keyboardType="decimal-pad" />
                </View>
              </View>
              <Text style={styles.inputLabel}>Supplier</Text>
              <View style={styles.supplierRow}>
                {suppliers?.map((s: any) => (
                  <TouchableOpacity key={s.id} style={[styles.supplierChip, itemForm.supplier_id === s.id && styles.supplierChipActive]} onPress={() => setItemForm({ ...itemForm, supplier_id: s.id })}>
                    <Text style={[styles.supplierText, itemForm.supplier_id === s.id && styles.supplierTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={itemForm.expiry_date} onChangeText={(t) => setItemForm({ ...itemForm, expiry_date: t })} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleSave}>
                <Text style={styles.modalSubmitText}>{editingItem ? 'Update Item' : 'Add Item'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: COLORS.white, fontWeight: '600', marginLeft: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  itemCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  itemGeneric: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  itemDetails: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 30, marginBottom: 10 },
  detailCol: { alignItems: 'center' },
  detailLabel: { fontSize: 10, color: COLORS.textLight, textTransform: 'uppercase' },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginLeft: 30, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  categoryText: { fontSize: 11, color: COLORS.textLight },
  categoryTextActive: { color: COLORS.primary, fontWeight: '600' },
  rowInputs: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  supplierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  supplierChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  supplierChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  supplierText: { fontSize: 11, color: COLORS.textLight },
  supplierTextActive: { color: COLORS.primary, fontWeight: '600' },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
