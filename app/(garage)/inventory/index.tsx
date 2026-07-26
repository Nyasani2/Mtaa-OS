import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Barcode,
  TrendingDown,
  TrendingUp,
  Truck,
  DollarSign,
  Box,
  ChevronRight,
  ArrowLeft,
  Filter,
  X,
  Minus,
  Edit3,
  Trash2,
  QrCode,
  ShoppingCart,
  Warehouse,
  Archive,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────── Types ─────────────────────────── */

interface InventoryItem {
  id: string;
  garage_id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  reorder_quantity: number;
  supplier_id: string | null;
  location: string | null;
  barcode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  supplier?: {
    name: string;
    phone: string;
    email: string;
  };
}

interface Supplier {
  id: string;
  garage_id: string;
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
}

/* ─────────────────────────── Main Screen ─────────────────────────── */

export default function InventoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'suppliers'>('all');

  const [showItemModal, setShowItemModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  /* ── Form States ── */
  const [itemForm, setItemForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'pcs',
    cost_price: '',
    selling_price: '',
    reorder_level: '5',
    reorder_quantity: '20',
    supplier_id: '',
    location: '',
    barcode: '',
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: 'Net 30',
  });

  /* ── Load Data ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const garageId = await getGarageId();
      if (!garageId) { setLoading(false); return; }

      const [itemsRes, suppliersRes] = await Promise.all([
        supabase
          .from('garage_inventory')
          .select(`*, supplier:supplier_id(name, phone, email)`)
          .eq('garage_id', garageId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('garage_suppliers')
          .select('*')
          .eq('garage_id', garageId)
          .eq('is_active', true)
          .order('name'),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;

      setItems(itemsRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (err: any) {
      console.error('Inventory load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getGarageId = async (): Promise<string | null> => {
    const { data } = await supabase
      .from('garages')
      .select('id')
      .eq('owner_id', user?.id)
      .single();
    return data?.id || null;
  };

  React.useEffect(() => { loadData(); }, [loadData]);

  /* ── Filter Logic ── */
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (activeTab === 'low') {
      filtered = items.filter((i) => i.quantity <= i.reorder_level);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.barcode?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [items, activeTab, searchQuery]);

  const lowStockCount = items.filter((i) => i.quantity <= i.reorder_level).length;
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.cost_price, 0);

  /* ── Handlers ── */
  const handleSaveItem = useCallback(async () => {
    if (!itemForm.sku || !itemForm.name) {
      Alert.alert('Required', 'SKU and Name are required');
      return;
    }

    try {
      const garageId = await getGarageId();
      if (!garageId) return;

      const payload = {
        garage_id: garageId,
        sku: itemForm.sku.trim().toUpperCase(),
        name: itemForm.name.trim(),
        description: itemForm.description || null,
        category: itemForm.category || 'General',
        quantity: parseInt(itemForm.quantity) || 0,
        unit: itemForm.unit,
        cost_price: parseFloat(itemForm.cost_price) || 0,
        selling_price: parseFloat(itemForm.selling_price) || 0,
        reorder_level: parseInt(itemForm.reorder_level) || 5,
        reorder_quantity: parseInt(itemForm.reorder_quantity) || 20,
        supplier_id: itemForm.supplier_id || null,
        location: itemForm.location || null,
        barcode: itemForm.barcode || null,
        is_active: true,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('garage_inventory')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('garage_inventory').insert(payload);
        if (error) throw error;
      }

      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, [itemForm, editingItem, loadData]);

  const handleSaveSupplier = useCallback(async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      Alert.alert('Required', 'Name and Phone are required');
      return;
    }

    try {
      const garageId = await getGarageId();
      if (!garageId) return;

      const { error } = await supabase.from('garage_suppliers').insert({
        garage_id: garageId,
        name: supplierForm.name.trim(),
        contact_person: supplierForm.contact_person || null,
        phone: supplierForm.phone.trim(),
        email: supplierForm.email || null,
        address: supplierForm.address || null,
        payment_terms: supplierForm.payment_terms || 'Net 30',
        is_active: true,
      });

      if (error) throw error;

      setShowSupplierModal(false);
      resetSupplierForm();
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, [supplierForm, loadData]);

  const handleDeleteItem = useCallback(
    (item: InventoryItem) => {
      Alert.alert('Delete Item', `Remove "${item.name}" from inventory?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('garage_inventory')
                .update({ is_active: false })
                .eq('id', item.id);
              if (error) throw error;
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]);
    },
    [loadData]
  );

  const handleAdjustStock = useCallback(
    (item: InventoryItem, delta: number) => {
      Alert.alert(
        delta > 0 ? 'Stock In' : 'Stock Out',
        `${delta > 0 ? 'Add' : 'Remove'} ${Math.abs(delta)} ${item.unit} of ${item.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                const newQty = Math.max(0, item.quantity + delta);
                const { error } = await supabase
                  .from('garage_inventory')
                  .update({ quantity: newQty, updated_at: new Date().toISOString() })
                  .eq('id', item.id);
                if (error) throw error;
                loadData();
              } catch (err: any) {
                Alert.alert('Error', err.message);
              }
            },
          },
        ]
      );
    },
    [loadData]
  );

  const openEditItem = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      sku: item.sku,
      name: item.name,
      description: item.description || '',
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      cost_price: item.cost_price.toString(),
      selling_price: item.selling_price.toString(),
      reorder_level: item.reorder_level.toString(),
      reorder_quantity: item.reorder_quantity.toString(),
      supplier_id: item.supplier_id || '',
      location: item.location || '',
      barcode: item.barcode || '',
    });
    setShowItemModal(true);
  }, []);

  const resetItemForm = () =>
    setItemForm({
      sku: '',
      name: '',
      description: '',
      category: '',
      quantity: '',
      unit: 'pcs',
      cost_price: '',
      selling_price: '',
      reorder_level: '5',
      reorder_quantity: '20',
      supplier_id: '',
      location: '',
      barcode: '',
    });

  const resetSupplierForm = () =>
    setSupplierForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: 'Net 30',
    });

  /* ── Render Helpers ── */
  const renderItemCard = ({ item }: { item: InventoryItem }) => {
    const isLow = item.quantity <= item.reorder_level;
    const profit = item.selling_price - item.cost_price;
    const margin = item.selling_price > 0 ? (profit / item.selling_price) * 100 : 0;

    return (
      <View style={[styles.itemCard, isLow && styles.itemCardLow]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <Package size={18} color={isLow ? '#ef4444' : '#3b82f6'} />
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          {isLow && (
            <View style={styles.lowBadge}>
              <AlertTriangle size={12} color="#fff" />
              <Text style={styles.lowBadgeText}>Low Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.itemMetaRow}>
          <Text style={styles.itemSku}>{item.sku}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>

        <View style={styles.itemStatsRow}>
          <View style={styles.itemStat}>
            <Text style={[styles.itemStatValue, isLow && { color: '#ef4444' }]}>
              {item.quantity}
            </Text>
            <Text style={styles.itemStatLabel}>{item.unit} in stock</Text>
          </View>
          <View style={styles.itemStat}>
            <Text style={styles.itemStatValue}>KES {item.selling_price.toLocaleString()}</Text>
            <Text style={styles.itemStatLabel}>selling price</Text>
          </View>
          <View style={styles.itemStat}>
            <Text style={[styles.itemStatValue, margin > 30 ? { color: '#22c55e' } : { color: '#f59e0b' }]}>
              {margin.toFixed(0)}%
            </Text>
            <Text style={styles.itemStatLabel}>margin</Text>
          </View>
        </View>

        {item.supplier && (
          <View style={styles.supplierRow}>
            <Truck size={14} color="#6b7280" />
            <Text style={styles.supplierText}>{item.supplier.name}</Text>
          </View>
        )}

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: '#fee2e2' }]}
            onPress={() => handleAdjustStock(item, -1)}
          >
            <Minus size={14} color="#ef4444" />
            <Text style={[styles.actionPillText, { color: '#ef4444' }]}>Stock Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: '#dcfce7' }]}
            onPress={() => handleAdjustStock(item, 1)}
          >
            <Plus size={14} color="#22c55e" />
            <Text style={[styles.actionPillText, { color: '#16a34a' }]}>Stock In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: '#eff6ff' }]}
            onPress={() => openEditItem(item)}
          >
            <Edit3 size={14} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: '#fef2f2' }]}
            onPress={() => handleDeleteItem(item)}
          >
            <Trash2 size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSupplierCard = ({ item }: { item: Supplier }) => (
    <View style={styles.supplierCard}>
      <View style={styles.supplierHeader}>
        <Truck size={18} color="#6b7280" />
        <Text style={styles.supplierName}>{item.name}</Text>
      </View>
      {item.contact_person && (
        <Text style={styles.supplierContact}>{item.contact_person}</Text>
      )}
      <View style={styles.supplierMeta}>
        <Text style={styles.supplierPhone}>{item.phone}</Text>
        {item.payment_terms && (
          <Text style={styles.supplierTerms}>{item.payment_terms}</Text>
        )}
      </View>
    </View>
  );

  /* ── Loading ── */
  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  /* ── Main Render ── */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventory</Text>
          <TouchableOpacity onPress={() => setShowItemModal(true)}>
            <View style={styles.addButton}>
              <Plus size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, SKU, barcode..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['all', 'low', 'suppliers'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All Items' : tab === 'low' ? `Low Stock (${lowStockCount})` : 'Suppliers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Row */}
      {activeTab !== 'suppliers' && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Archive size={20} color="#3b82f6" />
            <Text style={styles.statNumber}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statBox}>
            <AlertTriangle size={20} color="#ef4444" />
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{lowStockCount}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statBox}>
            <DollarSign size={20} color="#22c55e" />
            <Text style={styles.statNumber}>KES {totalValue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Stock Value</Text>
          </View>
        </View>
      )}

      {/* List */}
      {activeTab === 'suppliers' ? (
        <FlatList
          data={suppliers}
          keyExtractor={(i) => i.id}
          renderItem={renderSupplierCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#3b82f6" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Truck size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No suppliers yet</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowSupplierModal(true)}>
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyButtonText}>Add Supplier</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => i.id}
          renderItem={renderItemCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#3b82f6" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Warehouse size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'low' ? 'No low stock items' : 'Inventory empty'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'low'
                  ? 'All items are above reorder level. Great job!'
                  : 'Add parts and supplies to start tracking inventory.'}
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowItemModal(true)}>
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyButtonText}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Add/Edit Item Modal ── */}
      <Modal visible={showItemModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
            <TouchableOpacity onPress={() => { setShowItemModal(false); setEditingItem(null); resetItemForm(); }}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Basic Info</Text>
            <View style={styles.inputGroup}>
              <Barcode size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="SKU / Part Number"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                value={itemForm.sku}
                onChangeText={(t) => setItemForm((p) => ({ ...p, sku: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <Package size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Item Name"
                placeholderTextColor="#9ca3af"
                value={itemForm.name}
                onChangeText={(t) => setItemForm((p) => ({ ...p, name: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <Box size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Category (e.g., Engine, Brake, Electrical)"
                placeholderTextColor="#9ca3af"
                value={itemForm.category}
                onChangeText={(t) => setItemForm((p) => ({ ...p, category: t }))}
              />
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Stock & Pricing</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Qty"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={itemForm.quantity}
                  onChangeText={(t) => setItemForm((p) => ({ ...p, quantity: t }))}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Unit (pcs, L, kg, m)"
                  placeholderTextColor="#9ca3af"
                  value={itemForm.unit}
                  onChangeText={(t) => setItemForm((p) => ({ ...p, unit: t }))}
                />
              </View>
            </View>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <DollarSign size={16} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Cost Price"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  value={itemForm.cost_price}
                  onChangeText={(t) => setItemForm((p) => ({ ...p, cost_price: t }))}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <DollarSign size={16} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Selling Price"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  value={itemForm.selling_price}
                  onChangeText={(t) => setItemForm((p) => ({ ...p, selling_price: t }))}
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Reorder Settings</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <AlertTriangle size={16} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Reorder Level"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={itemForm.reorder_level}
                  onChangeText={(t) => setItemForm((p) => ({ ...p, reorder_level: t }))}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <ShoppingCart size={16} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Reorder Qty"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={itemForm.reorder_quantity}
                  onChangeText={(t) => setItemForm((p) => ({ ...p, reorder_quantity: t }))}
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Additional</Text>
            <View style={styles.inputGroup}>
              <QrCode size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Barcode (scan or type)"
                placeholderTextColor="#9ca3af"
                value={itemForm.barcode}
                onChangeText={(t) => setItemForm((p) => ({ ...p, barcode: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <Warehouse size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Storage Location (e.g., Shelf A3)"
                placeholderTextColor="#9ca3af"
                value={itemForm.location}
                onChangeText={(t) => setItemForm((p) => ({ ...p, location: t }))}
              />
            </View>

            {suppliers.length > 0 && (
              <View style={styles.inputGroup}>
                <Truck size={16} color="#6b7280" />
                <Text style={styles.inputLabel}>Supplier:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={[styles.supplierChip, !itemForm.supplier_id && styles.supplierChipActive]}
                    onPress={() => setItemForm((p) => ({ ...p, supplier_id: '' }))}
                  >
                    <Text style={!itemForm.supplier_id ? styles.supplierChipTextActive : styles.supplierChipText}>None</Text>
                  </TouchableOpacity>
                  {suppliers.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.supplierChip, itemForm.supplier_id === s.id && styles.supplierChipActive]}
                      onPress={() => setItemForm((p) => ({ ...p, supplier_id: s.id }))}
                    >
                      <Text style={itemForm.supplier_id === s.id ? styles.supplierChipTextActive : styles.supplierChipText}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowItemModal(false); setEditingItem(null); resetItemForm(); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
              <Text style={styles.saveBtnText}>{editingItem ? 'Update Item' : 'Add Item'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Supplier Modal ── */}
      <Modal visible={showSupplierModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Supplier</Text>
            <TouchableOpacity onPress={() => { setShowSupplierModal(false); resetSupplierForm(); }}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionLabel}>Supplier Info</Text>
            <View style={styles.inputGroup}>
              <Truck size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Company Name"
                placeholderTextColor="#9ca3af"
                value={supplierForm.name}
                onChangeText={(t) => setSupplierForm((p) => ({ ...p, name: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <User size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Contact Person"
                placeholderTextColor="#9ca3af"
                value={supplierForm.contact_person}
                onChangeText={(t) => setSupplierForm((p) => ({ ...p, contact_person: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <Phone size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={supplierForm.phone}
                onChangeText={(t) => setSupplierForm((p) => ({ ...p, phone: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <Mail size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                value={supplierForm.email}
                onChangeText={(t) => setSupplierForm((p) => ({ ...p, email: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <MapPin size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#9ca3af"
                value={supplierForm.address}
                onChangeText={(t) => setSupplierForm((p) => ({ ...p, address: t }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <DollarSign size={16} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Payment Terms (e.g., Net 30, COD)"
                placeholderTextColor="#9ca3af"
                value={supplierForm.payment_terms}
                onChangeText={(t) => setSupplierForm((p) => ({ ...p, payment_terms: t }))}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowSupplierModal(false); resetSupplierForm(); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSupplier}>
              <Text style={styles.saveBtnText}>Add Supplier</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  /* Header */
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },

  /* Search */
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1f2937' },

  /* Tabs */
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },

  /* Stats */
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statNumber: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  /* List */
  listContent: { padding: 12, paddingBottom: 40 },

  /* Item Card */
  itemCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  itemCardLow: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginLeft: 8, flex: 1 },
  lowBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  lowBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff', marginLeft: 4 },
  itemMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  itemSku: { fontSize: 12, color: '#6b7280', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  itemCategory: { fontSize: 12, color: '#3b82f6', fontWeight: '600', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  itemStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemStat: { alignItems: 'center' },
  itemStatValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  itemStatLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  supplierRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  supplierText: { fontSize: 12, color: '#6b7280', marginLeft: 6 },
  itemActions: { flexDirection: 'row', gap: 8 },
  actionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionPillText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

  /* Supplier Card */
  supplierCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  supplierName: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginLeft: 8 },
  supplierContact: { fontSize: 13, color: '#6b7280', marginLeft: 26, marginBottom: 4 },
  supplierMeta: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 26 },
  supplierPhone: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  supplierTerms: { fontSize: 12, color: '#6b7280' },

  /* Empty */
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  /* Modal */
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  modalBody: { flex: 1, padding: 16 },
  modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1f2937' },
  inputLabel: { fontSize: 13, color: '#4b5563', marginLeft: 10 },
  rowInputs: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },

  supplierChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 8 },
  supplierChipActive: { backgroundColor: '#3b82f6' },
  supplierChipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  supplierChipTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },

  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});