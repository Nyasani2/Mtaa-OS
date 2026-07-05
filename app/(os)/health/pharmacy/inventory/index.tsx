import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList, ScrollView, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';

interface InventoryItem {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  sku: string | null;
  batch_number: string | null;
  manufacturer: string | null;
  expiry_date: string | null;
  quantity: number;
  reorder_level: number;
  cost_price: number;
  selling_price: number;
  storage_location: string | null;
  status: string;
  qr_code_data: string | null;
}

export default function InventoryManagementScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newItem, setNewItem] = useState({
    name: '',
    generic_name: '',
    category: 'medication',
    drug_form: 'tablet',
    strength: '',
    batch_number: '',
    manufacturer: '',
    manufactured_date: '',
    expiry_date: '',
    quantity: '',
    unit_of_measure: 'pieces',
    reorder_level: '10',
    cost_price: '',
    selling_price: '',
    storage_location: '',
    temperature_requirement: 'room_temp',
  });

  const facilityId = staffRecord?.facility_id;

  const fetchInventory = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_inventory')
        .select('*')
        .eq('facility_id', facilityId)
        .order('name');

      if (error) throw error;
      setInventory(data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity || !newItem.selling_price) {
      Alert.alert('Error', 'Name, quantity, and selling price are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('health_inventory')
        .insert({
          facility_id: facilityId,
          name: newItem.name,
          generic_name: newItem.generic_name || null,
          category: newItem.category,
          drug_form: newItem.drug_form,
          strength: newItem.strength || null,
          batch_number: newItem.batch_number || null,
          manufacturer: newItem.manufacturer || null,
          manufactured_date: newItem.manufactured_date || null,
          expiry_date: newItem.expiry_date || null,
          quantity: parseInt(newItem.quantity),
          unit_of_measure: newItem.unit_of_measure,
          reorder_level: parseInt(newItem.reorder_level) || 10,
          cost_price: parseFloat(newItem.cost_price) || 0,
          selling_price: parseFloat(newItem.selling_price),
          storage_location: newItem.storage_location || null,
          temperature_requirement: newItem.temperature_requirement,
          status: 'active',
          created_by: staffRecord?.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate QR code for the item
      if (data) {
        await supabase.rpc('generate_inventory_qr', {
          p_inventory_id: data.id,
        });
      }

      Alert.alert('Success', 'Item added to inventory');
      setShowAddForm(false);
      setNewItem({
        name: '', generic_name: '', category: 'medication', drug_form: 'tablet',
        strength: '', batch_number: '', manufacturer: '', manufactured_date: '',
        expiry_date: '', quantity: '', unit_of_measure: 'pieces', reorder_level: '10',
        cost_price: '', selling_price: '', storage_location: '', temperature_requirement: 'room_temp',
      });
      fetchInventory();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStockAdjustment = async (item: InventoryItem, adjustment: number, reason: string) => {
    const newQty = Math.max(0, item.quantity + adjustment);
    try {
      const { error } = await supabase
        .from('health_inventory')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;

      // Log transaction
      await supabase.from('health_inventory_transactions').insert({
        facility_id: facilityId,
        inventory_id: item.id,
        transaction_type: adjustment > 0 ? 'stock_in' : 'stock_out',
        quantity_before: item.quantity,
        quantity_change: adjustment,
        quantity_after: newQty,
        reason: reason,
        performed_by: staffRecord?.user_id,
      });

      fetchInventory();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesFilter = filter === 'all' || 
      (filter === 'low_stock' && item.quantity <= item.reorder_level) ||
      (filter === 'expired' && item.expiry_date && new Date(item.expiry_date) < new Date()) ||
      (filter === 'out_of_stock' && item.quantity === 0) ||
      item.status === filter;

    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch_number?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (item: InventoryItem) => {
    if (item.quantity === 0) return '#e74c3c';
    if (item.expiry_date && new Date(item.expiry_date) < new Date()) return '#e74c3c';
    if (item.quantity <= item.reorder_level) return '#f39c12';
    return '#27ae60';
  };

  const getStatusText = (item: InventoryItem) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.expiry_date && new Date(item.expiry_date) < new Date()) return 'Expired';
    if (item.quantity <= item.reorder_level) return 'Low Stock';
    return 'OK';
  };

  if (!facilityId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No facility assigned. Please contact admin.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Text style={styles.headerSubtitle}>
          {inventory.length} items • {inventory.filter(i => i.quantity <= i.reorder_level).length} low stock
        </Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, SKU, or batch..."
        />
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'low_stock', label: 'Low Stock' },
            { key: 'expired', label: 'Expired' },
            { key: 'out_of_stock', label: 'Out' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
        <Text style={styles.addButtonText}>+ Add New Item</Text>
      </TouchableOpacity>

      {/* Inventory List */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0A7B5A" />
      ) : (
        <FlatList
          data={filteredInventory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item) }]} />
                </View>
                <Text style={styles.itemSubtitle}>
                  {item.category} • {item.drug_form || 'N/A'} • Batch: {item.batch_number || 'N/A'}
                </Text>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Stock</Text>
                  <Text style={[styles.detailValue, item.quantity <= item.reorder_level && styles.detailValueWarning]}>
                    {item.quantity} {item.unit_of_measure}
                  </Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>KES {item.selling_price?.toFixed(2)}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Expiry</Text>
                  <Text style={[
                    styles.detailValue,
                    item.expiry_date && new Date(item.expiry_date) < new Date() && styles.detailValueDanger
                  ]}>
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(item) }]}>
                    {getStatusText(item)}
                  </Text>
                </View>
              </View>

              {item.qr_code_data && (
                <View style={styles.qrSection}>
                  <Text style={styles.qrLabel}>QR Code Generated</Text>
                  <Text style={styles.qrData} numberOfLines={1}>{item.qr_code_data}</Text>
                </View>
              )}

              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    Alert.prompt(
                      'Stock In',
                      `Add stock for ${item.name}`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Add', 
                          onPress: (value) => value && handleStockAdjustment(item, parseInt(value) || 0, 'Stock received')
                        }
                      ],
                      'plain-text',
                      '',
                      'numeric'
                    );
                  }}
                >
                  <Text style={styles.actionBtnText}>+ Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    Alert.prompt(
                      'Stock Out',
                      `Remove stock for ${item.name}`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Remove', 
                          onPress: (value) => value && handleStockAdjustment(item, -(parseInt(value) || 0), 'Stock adjustment')
                        }
                      ],
                      'plain-text',
                      '',
                      'numeric'
                    );
                  }}
                >
                  <Text style={styles.actionBtnText}>− Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No inventory items found</Text>
          }
        />
      )}

      {/* Add Item Modal (simplified - would be a proper modal in production) */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>

            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} value={newItem.name} onChangeText={v => setNewItem(p => ({ ...p, name: v }))} />

            <Text style={styles.label}>Generic Name</Text>
            <TextInput style={styles.input} value={newItem.generic_name} onChangeText={v => setNewItem(p => ({ ...p, generic_name: v }))} />

            <Text style={styles.label}>Category</Text>
            <View style={styles.optionsRow}>
              {['medication', 'medical_supply', 'laboratory_reagent', 'equipment', 'vaccine', 'consumable'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.optionChip, newItem.category === c && styles.optionChipActive]}
                  onPress={() => setNewItem(p => ({ ...p, category: c }))}
                >
                  <Text style={[styles.optionChipText, newItem.category === c && styles.optionChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Batch Number</Text>
            <TextInput style={styles.input} value={newItem.batch_number} onChangeText={v => setNewItem(p => ({ ...p, batch_number: v }))} />

            <Text style={styles.label}>Manufacturer</Text>
            <TextInput style={styles.input} value={newItem.manufacturer} onChangeText={v => setNewItem(p => ({ ...p, manufacturer: v }))} />

            <Text style={styles.label}>Expiry Date</Text>
            <TextInput style={styles.input} value={newItem.expiry_date} onChangeText={v => setNewItem(p => ({ ...p, expiry_date: v }))} placeholder="YYYY-MM-DD" />

            <Text style={styles.label}>Quantity *</Text>
            <TextInput style={styles.input} value={newItem.quantity} onChangeText={v => setNewItem(p => ({ ...p, quantity: v }))} keyboardType="numeric" />

            <Text style={styles.label}>Selling Price (KES) *</Text>
            <TextInput style={styles.input} value={newItem.selling_price} onChangeText={v => setNewItem(p => ({ ...p, selling_price: v }))} keyboardType="numeric" />

            <Text style={styles.label}>Cost Price (KES)</Text>
            <TextInput style={styles.input} value={newItem.cost_price} onChangeText={v => setNewItem(p => ({ ...p, cost_price: v }))} keyboardType="numeric" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddItem}>
                <Text style={styles.saveBtnText}>Save Item</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#0A7B5A', paddingTop: 60 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#E0F2E9', marginTop: 2 },
  searchSection: { padding: 12, backgroundColor: '#fff' },
  searchInput: {
    backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#ddd'
  },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterChipActive: { backgroundColor: '#0A7B5A' },
  filterChipText: { fontSize: 12, color: '#666' },
  filterChipTextActive: { color: '#fff', fontWeight: '500' },
  addButton: { margin: 12, backgroundColor: '#0A7B5A', padding: 14, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loader: { marginTop: 40 },
  list: { padding: 12 },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  itemHeader: { marginBottom: 12 },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  itemSubtitle: { fontSize: 12, color: '#999', marginTop: 4 },
  itemDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  detailCol: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  detailValueWarning: { color: '#f39c12' },
  detailValueDanger: { color: '#e74c3c' },
  qrSection: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginTop: 8 },
  qrLabel: { fontSize: 11, color: '#666' },
  qrData: { fontSize: 10, color: '#999', marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, color: '#333', fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
  errorText: { textAlign: 'center', marginTop: 100, fontSize: 16, color: '#e74c3c' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, marginTop: 12, color: '#333' },
  input: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#ddd' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  optionChipActive: { backgroundColor: '#0A7B5A', borderColor: '#0A7B5A' },
  optionChipText: { fontSize: 12, color: '#333' },
  optionChipTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  cancelBtnText: { color: '#333', fontWeight: '600' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 8, backgroundColor: '#0A7B5A', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
