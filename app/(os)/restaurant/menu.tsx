// @ts-nocheck
import React, { useState, useEffect } from 'react';
// ============================================================================
// MTAA Restaurant Module — Menu Management Screen
// ============================================================================

import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Switch, ScrollView, RefreshControl } from 'react-native';
import { Alert, useMenu } from '@/lib/restaurant/hooks';

export default function RestaurantMenu() {
  const {
    items, categories, currentItem, isLoading, error,
    loadCategories, loadItems, createItem, updateItem,
    toggleAvailability, deleteItem, loadItem, clearError
  } = useMenu();

  const [refreshing, setRefreshing] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    preparation_time: '',
    is_available: true,
    allergens: '',
    image_url: '',
    modifiers: '',
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', sort_order: '0' });

  useEffect(() => {
    loadCategories();
    loadItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadItems()]);
    setRefreshing(false);
  };

  const resetItemForm = () => {
    setItemForm({
      name: '', description: '', price: '', category_id: '',
      preparation_time: '', is_available: true, allergens: '',
      image_url: '', modifiers: '',
    });
    setEditingItem(null);
  };

  const handleSaveItem = async () => {
    try {
      const payload = {
        name: itemForm.name,
        description: itemForm.description || undefined,
        price: parseFloat(itemForm.price) || 0,
        category_id: itemForm.category_id || undefined,
        preparation_time: itemForm.preparation_time ? parseInt(itemForm.preparation_time) : undefined,
        is_available: itemForm.is_available,
        allergens: itemForm.allergens ? itemForm.allergens.split(',').map((s: any) => s.trim()) : undefined,
        image_url: itemForm.image_url || undefined,
        modifiers: itemForm.modifiers ? JSON.parse(itemForm.modifiers) : undefined,
      };

      if (editingItem) {
        await updateItem(editingItem.id, payload);
        Alert.alert('Success', 'Item updated');
      } else {
        await createItem(payload as any);
        Alert.alert('Success', 'Item created');
      }
      setShowItemModal(false);
      resetItemForm();
      loadItems();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category_id: item.category_id || '',
      preparation_time: item.preparation_time ? String(item.preparation_time) : '',
      is_available: item.is_available,
      allergens: item.allergens?.join(', ') || '',
      image_url: item.image_url || '',
      modifiers: item.modifiers ? JSON.stringify(item.modifiers) : '',
    });
    setShowItemModal(true);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(itemId);
              loadItems();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c: any) => c.id === catId)?.name || 'Uncategorized';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { resetItemForm(); setShowItemModal(true); }}>
          <Text style={styles.addButtonText}>+ New Item</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
        <TouchableOpacity style={[styles.categoryTab, styles.categoryTabActive]}>
          <Text style={[styles.categoryTabText, styles.categoryTabTextActive]}>All Items</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryTab}>
            <Text style={styles.categoryTabText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addCategoryTab} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.addCategoryTabText}>+ Category</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.itemsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, !item.is_available && styles.itemCardDisabled]}>
            <View style={styles.itemInfo}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemBadges}>
                  {!item.is_available && (
                    <View style={styles.badgeUnavailable}>
                      <Text style={styles.badgeText}>Unavailable</Text>
                    </View>
                  )}
                  {item.allergens && item.allergens.length > 0 && (
                    <View style={styles.badgeAllergen}>
                      <Text style={styles.badgeText}>⚠️ Allergens</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.itemCategory}>{getCategoryName(item.category_id)}</Text>
              {item.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={styles.itemFooter}>
                <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
                {item.preparation_time && (
                  <Text style={styles.itemPrepTime}>⏱️ {item.preparation_time}m</Text>
                )}
              </View>
            </View>
            <View style={styles.itemActions}>
              <Switch
                value={item.is_available}
                onValueChange={(val) => toggleAvailability(item.id, val)}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              />
              <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditItem(item)}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteItem(item.id)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Loading...' : 'No menu items yet'}
            </Text>
          </View>
        }
      />

      {/* Item Modal */}
      <Modal visible={showItemModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'New Menu Item'}
              </Text>
              <TouchableOpacity onPress={() => { setShowItemModal(false); resetItemForm(); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Item Name *"
              value={itemForm.name}
              onChangeText={(t) => setItemForm(p => ({ ...p, name: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              value={itemForm.description}
              onChangeText={(t) => setItemForm(p => ({ ...p, description: t }))}
              multiline
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Price (£) *"
              value={itemForm.price}
              onChangeText={(t) => setItemForm(p => ({ ...p, price: t }))}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Preparation Time (minutes)"
              value={itemForm.preparation_time}
              onChangeText={(t) => setItemForm(p => ({ ...p, preparation_time: t }))}
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Allergens (comma separated)"
              value={itemForm.allergens}
              onChangeText={(t) => setItemForm(p => ({ ...p, allergens: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Image URL"
              value={itemForm.image_url}
              onChangeText={(t) => setItemForm(p => ({ ...p, image_url: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Modifiers (JSON)"
              value={itemForm.modifiers}
              onChangeText={(t) => setItemForm(p => ({ ...p, modifiers: t }))}
              multiline
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Available</Text>
              <Switch
                value={itemForm.is_available}
                onValueChange={(val) => setItemForm(p => ({ ...p, is_available: val }))}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSaveItem}>
              <Text style={styles.submitButtonText}>
                {editingItem ? 'Update Item' : 'Create Item'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Category Name *"
              value={categoryForm.name}
              onChangeText={(t) => setCategoryForm(p => ({ ...p, name: t }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Sort Order"
              value={categoryForm.sort_order}
              onChangeText={(t) => setCategoryForm(p => ({ ...p, sort_order: t }))}
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.submitButton} onPress={() => { setShowCategoryModal(false); }}>
              <Text style={styles.submitButtonText}>Create Category</Text>
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
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  categoryBar: { padding: 12, backgroundColor: '#FFFFFF' },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryTabActive: { backgroundColor: '#1F2937' },
  categoryTabText: { fontSize: 13, color: '#4B5563' },
  categoryTabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  addCategoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    marginRight: 8,
  },
  addCategoryTabText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  itemsList: { padding: 12 },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemCardDisabled: { opacity: 0.6 },
  itemInfo: { flex: 1 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1 },
  itemBadges: { flexDirection: 'row', gap: 6 },
  badgeUnavailable: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAllergen: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  itemCategory: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  itemDescription: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  itemPrepTime: { fontSize: 12, color: '#9CA3AF' },
  itemActions: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  actionIcon: { padding: 6 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 15, color: '#9CA3AF' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: { fontSize: 15, color: '#374151' },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
