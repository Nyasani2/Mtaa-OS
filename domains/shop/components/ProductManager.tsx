// domains/shop/components/ProductManager.tsx
// Product management component for MTAA Shop
// Imported by: app/(commerce)/shop/[id]/products.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock_quantity: number;
  category: string;
  status: 'active' | 'out_of_stock' | 'discontinued';
  images: string[];
  created_at: string;
}

export interface ProductManagerProps {
  products: Product[];
  currency?: string;
  onAdd?: (product: Partial<Product>) => void;
  onEdit?: (id: string, product: Partial<Product>) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export default function ProductManager({ products, currency = 'KES', onAdd, onEdit, onDelete, loading }: ProductManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    category: '',
    status: 'active',
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: 0, stock_quantity: 0, category: '', status: 'active' });
    setModalVisible(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({ ...product });
    setModalVisible(true);
  };

  const save = () => {
    if (!form.name?.trim()) {
      Alert.alert('Required', 'Product name is required');
      return;
    }
    if (editingId) {
      onEdit?.(editingId, form);
    } else {
      onAdd?.(form);
    }
    setModalVisible(false);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(id) },
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>{currency} {item.price.toLocaleString()}</Text>
        <View style={styles.stockRow}>
          <Text style={styles.stockText}>Stock: {item.stock_quantity}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.statusText, { color: item.status === 'active' ? '#22c55e' : '#ef4444' }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Ionicons name="create-outline" size={20} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(item.id, item.name)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Add Product</Text>
      </TouchableOpacity>

      {/* Product List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No products yet</Text>
            </View>
          }
        />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Product' : 'Add Product'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              placeholderTextColor="#9ca3af"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#9ca3af"
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={form.price?.toString() || ''}
              onChangeText={(t) => setForm({ ...form, price: parseFloat(t) || 0 })}
            />
            <TextInput
              style={styles.input}
              placeholder="Stock Quantity"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              value={form.stock_quantity?.toString() || ''}
              onChangeText={(t) => setForm({ ...form, stock_quantity: parseInt(t) || 0 })}
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              placeholderTextColor="#9ca3af"
              value={form.category}
              onChangeText={(t) => setForm({ ...form, category: t })}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={save}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#0a0a0a' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15, marginLeft: 6 },
  list: { padding: 12 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#0a0a0a' },
  productCategory: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#2563eb', marginTop: 4 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stockText: { fontSize: 12, color: '#6b7280', marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row' },
  actionBtn: { padding: 8, marginLeft: 4 },
  loadingText: { textAlign: 'center', marginTop: 40, color: '#6b7280' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0a0a0a',
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  cancelText: { color: '#6b7280', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb' },
  saveText: { color: '#fff', fontWeight: '600' },
});
