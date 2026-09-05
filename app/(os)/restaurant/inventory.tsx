// @ts-nocheck
import React, { useState, useEffect } from 'react';
// ============================================================================
// MTAA Restaurant Module — Inventory Management Screen
// ============================================================================

import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, RefreshControl, ScrollView } from 'react-native';
import { useInventory } from '@/lib/restaurant/hooks';

export default function RestaurantInventory() {
  const {
    items, transactions, lowStock, isLoading, error,
    loadItems, createItem, updateItem, recordTransaction,
    loadLowStock, loadTransactions, clearError
  } = useInventory();

  const [refreshing, setRefreshing] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    name: '', sku: '', category: '', unit: '',
    current_quantity: '', reorder_level: '',
    unit_cost: '', supplier_id: '',
  });
  const [transactionForm, setTransactionForm] = useState({
    type: 'purchase' as const,
    quantity: '',
    unit_cost: '',
    reason: '',
    supplier_id: '',
  });

  useEffect(() => {
    loadItems();
    loadLowStock();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadItems(), loadLowStock()]);
    setRefreshing(false);
  };

  const resetForms = () => {
    setItemForm({ name: '', sku: '', category: '', unit: '', current_quantity: '', reorder_level: '', unit_cost: '', supplier_id: '' });
    setTransactionForm({ type: 'purchase', quantity: '', unit_cost: '', reason: '', supplier_id: '' });
    setSelectedItem(null);
  };

  const handleCreateItem = async () => {
    try {
      await createItem({
        name: itemForm.name,
        sku: itemForm.sku || undefined,
        category: itemForm.category || undefined,
        unit: itemForm.unit || 'units',
        current_quantity: parseFloat(itemForm.current_quantity) || 0,
        reorder_level: parseFloat(itemForm.reorder_level) || 0,
        unit_cost: itemForm.unit_cost ? parseFloat(itemForm.unit_cost) : undefined,
        supplier_id: itemForm.supplier_id || undefined,
      } as any);
      setShowItemModal(false);
      resetForms();
      loadItems();
      loadLowStock();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTransaction = async () => {
    if (!selectedItem) return;
    try {
      await recordTransaction({
        item_id: selectedItem.id,
        type: transactionForm.type,
        quantity: parseFloat(transactionForm.quantity),
        unit_cost: transactionForm.unit_cost ? parseFloat(transactionForm.unit_cost) : undefined,
        reason: transactionForm.reason || undefined,
        supplier_id: transactionForm.supplier_id || undefined,
      });
      setShowTransactionModal(false);
      resetForms();
      loadItems();
      loadLowStock();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getStockColor = (item: any) => {
    if (item.current_quantity <= 0) return '#EF4444';
    if (item.current_quantity <= item.reorder_level) return '#F59E0B';
    return '#10B981';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { resetForms(); setShowItemModal(true); }}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Low Stock Alert Banner */}
      {lowStock.length > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={() => router.push("/(os)/restaurant/inventory/low-stock" as any)}>
          <Text style={styles.alertBannerText}>
            ⚠️ {lowStock.length} item{lowStock.length > 1 ? 's' : ''} below reorder level
          </Text>
        </TouchableOpacity>
      )}

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.itemsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => { setSelectedItem(item); setShowTransactionModal(true); }}
          >
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.sku && <Text style={styles.itemSku}>SKU: {item.sku}</Text>}
                <Text style={styles.itemCategory}>{item.category || 'General'}</Text>
              </View>
              <View style={styles.itemStock}>
                <Text style={[styles.stockValue, { color: getStockColor(item) }]}>
                  {item.current_quantity} {item.unit}
                </Text>
                <View style={[styles.stockBar, { backgroundColor: getStockColor(item) + '30' }]}>
                  <View style={[styles.stockBarFill, {
                    backgroundColor: getStockColor(item),
                    width: `${Math.min(100, (item.current_quantity / Math.max(item.reorder_level * 2, 1)) * 100)}%`,
                  }]} />
                </View>
                <Text style={styles.reorderText}>Reorder: {item.reorder_level} {item.unit}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{isLoading ? 'Loading...' : 'No inventory items'}</Text>
          </View>
        }
      />

      {/* Add Item Modal */}
      <Modal visible={showItemModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Inventory Item</Text>
              <TouchableOpacity onPress={() => { setShowItemModal(false); resetForms(); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Item Name *" value={itemForm.name} onChangeText={t => setItemForm(p => ({ ...p, name: t }))} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="SKU" value={itemForm.sku} onChangeText={t => setItemForm(p => ({ ...p, sku: t }))} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Category" value={itemForm.category} onChangeText={t => setItemForm(p => ({ ...p, category: t }))} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Unit (kg, L, pcs, etc.)" value={itemForm.unit} onChangeText={t => setItemForm(p => ({ ...p, unit: t }))} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Current Quantity *" value={itemForm.current_quantity} onChangeText={t => setItemForm(p => ({ ...p, current_quantity: t }))} keyboardType="decimal-pad" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Reorder Level *" value={itemForm.reorder_level} onChangeText={t => setItemForm(p => ({ ...p, reorder_level: t }))} keyboardType="decimal-pad" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Unit Cost (£)" value={itemForm.unit_cost} onChangeText={t => setItemForm(p => ({ ...p, unit_cost: t }))} keyboardType="decimal-pad" placeholderTextColor="#9CA3AF" />
            <TouchableOpacity style={styles.submitButton} onPress={handleCreateItem}>
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Transaction Modal */}
      <Modal visible={showTransactionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Transaction</Text>
              <TouchableOpacity onPress={() => { setShowTransactionModal(false); resetForms(); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.transactionItem}>{selectedItem?.name}</Text>
            <Text style={styles.transactionCurrent}>Current: {selectedItem?.current_quantity} {selectedItem?.unit}</Text>

            <View style={styles.typeSelector}>
              {(['purchase', 'usage', 'waste', 'adjustment'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, transactionForm.type === type && styles.typeChipActive]}
                  onPress={() => setTransactionForm(p => ({ ...p, type }))}
                >
                  <Text style={[styles.typeChipText, transactionForm.type === type && styles.typeChipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Quantity *"
              value={transactionForm.quantity}
              onChangeText={t => setTransactionForm(p => ({ ...p, quantity: t }))}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
            {transactionForm.type === 'purchase' && (
              <TextInput
                style={styles.input}
                placeholder="Unit Cost (£)"
                value={transactionForm.unit_cost}
                onChangeText={t => setTransactionForm(p => ({ ...p, unit_cost: t }))}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Reason / Notes"
              value={transactionForm.reason}
              onChangeText={t => setTransactionForm(p => ({ ...p, reason: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleTransaction}>
              <Text style={styles.submitButtonText}>Record Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  addButton: { backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  alertBanner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertBannerText: { fontSize: 13, color: '#92400E', fontWeight: '500' },
  itemsList: { padding: 12 },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  itemSku: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemCategory: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  itemStock: { alignItems: 'flex-end', minWidth: 100 },
  stockValue: { fontSize: 18, fontWeight: 'bold' },
  stockBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  stockBarFill: { height: '100%', borderRadius: 3 },
  reorderText: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 15, color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalClose: { fontSize: 24, color: '#6B7280', padding: 4 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  transactionItem: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  transactionCurrent: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  typeChipActive: { backgroundColor: '#3B82F6' },
  typeChipText: { fontSize: 13, color: '#4B5563' },
  typeChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
});
