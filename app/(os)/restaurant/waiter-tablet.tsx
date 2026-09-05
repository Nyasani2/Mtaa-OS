// @ts-nocheck
// ============================================================================
// MTAA Restaurant Module — Waiter Tablet Screen
// Table-side ordering with direct kitchen send, table management, order status
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { usePos, useMenuSearch, useTables, useKds } from '@/lib/restaurant/hooks';

export default function WaiterTablet() {
  const {
    cart, cartTotal, cartItemCount,
    addToCart, removeFromCart, updateQuantity,
    submitOrder, clearCart
  } = usePos();

  const {
    items: menuItems,
    categories,
    isLoading: menuLoading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter
  } = useMenuSearch();

  const { tables: tableList, loadTables, updateTableStatus } = useTables();
  const { loadTickets } = useKds();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedTableObj, setSelectedTableObj] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [activeTab, setActiveTab] = useState<'tables' | 'orders'>('tables');

  useEffect(() => {
    loadTables();
  }, []);

  const handleTableSelect = (table: any) => {
    setSelectedTable(table.id);
    setSelectedTableObj(table);
    setShowMenu(true);
    setCustomerName('');
  };

  const handleAddToCart = useCallback(() => {
    if (!selectedItem) return;
    addToCart(selectedItem, itemQuantity, {}, itemNotes);
    setSelectedItem(null);
    setItemQuantity(1);
    setItemNotes('');
  }, [selectedItem, itemQuantity, itemNotes, addToCart]);

  const handleSendToKitchen = async () => {
    if (!cart.length) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }
    if (!selectedTable) {
      Alert.alert('Error', 'No table selected');
      return;
    }
    try {
      const order = await submitOrder(
        selectedTable,
        'dine_in',
        { customer_name: customerName || undefined }
      );
      Alert.alert('Success', `Order #${order.order_number} sent to kitchen!`);
      setShowCart(false);
      setShowMenu(false);
      setSelectedTable(null);
      setSelectedTableObj(null);
      setCustomerName('');
      loadTables();
      loadTickets();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTableStatus = async (tableId: string, status: string) => {
    try {
      await updateTableStatus(tableId, status);
      loadTables();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'occupied': return '#EF4444';
      case 'reserved': return '#F59E0B';
      case 'cleaning': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  // Tables View
  if (!showMenu) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Waiter Tablet</Text>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tables' && styles.tabActive]}
              onPress={() => setActiveTab('tables')}
            >
              <Text style={[styles.tabText, activeTab === 'tables' && styles.tabTextActive]}>
                🪑 Tables
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
              onPress={() => setActiveTab('orders')}
            >
              <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
                📋 Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'tables' && (
          <ScrollView style={styles.content}>
            {/* Table Grid */}
            <View style={styles.tableGrid}>
              {(tableList || []).map((table) => (
                <TouchableOpacity
                  key={table.id}
                  style={[
                    styles.tableCard,
                    { borderColor: getTableStatusColor(table.status) }
                  ]}
                  onPress={() => table.status === 'available' && handleTableSelect(table)}
                  disabled={table.status !== 'available'}
                >
                  <View style={[styles.tableStatusDot, { backgroundColor: getTableStatusColor(table.status) }]} />
                  <Text style={styles.tableNumber}>{table.table_number}</Text>
                  <Text style={styles.tableCapacity}>{table.capacity} seats</Text>
                  <Text style={[styles.tableStatus, { color: getTableStatusColor(table.status) }]}>
                    {table.status}
                  </Text>
                  {table.status === 'occupied' && (
                    <Text style={styles.tableOccupied}>Occupied</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendText}>Available</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Occupied</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>Reserved</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} /><Text style={styles.legendText}>Cleaning</Text></View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'orders' && (
          <View style={styles.content}>
            <Text style={styles.emptyText}>Active orders will appear here</Text>
          </View>
        )}
      </View>
    );
  }

  // Menu Ordering View
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <TouchableOpacity onPress={() => { setShowMenu(false); setSelectedTable(null); clearCart(); }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.tableInfo}>
          <Text style={styles.tableHeaderTitle}>Table {selectedTableObj?.table_number}</Text>
          <Text style={styles.tableHeaderSub}>{selectedTableObj?.capacity} seats</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Customer Name */}
      <View style={styles.customerBar}>
        <TextInput
          style={styles.customerInput}
          placeholder="Customer name (optional)..."
          value={customerName}
          onChangeText={setCustomerName}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
        <TouchableOpacity
          style={[styles.categoryChip, !categoryFilter && styles.categoryChipActive]}
          onPress={() => setCategoryFilter(null)}
        >
          <Text style={[styles.categoryChipText, !categoryFilter && styles.categoryChipTextActive]}>All</Text>
        </TouchableOpacity>
        {(categories || []).map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, categoryFilter === cat.id && styles.categoryChipActive]}
            onPress={() => setCategoryFilter(cat.id)}
          >
            <Text style={[styles.categoryChipText, categoryFilter === cat.id && styles.categoryChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu Grid */}
      <FlatList
        data={menuItems || []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.menuGrid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.menuCard, !item.is_available && styles.menuCardDisabled]}
            onPress={() => item.is_available && setSelectedItem(item)}
            disabled={!item.is_available}
          >
            <View style={styles.menuCardContent}>
              <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.menuItemPrice}>KSh {item.price.toFixed(2)}</Text>
              {!item.is_available && <Text style={styles.unavailableBadge}>Unavailable</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {menuLoading ? 'Loading...' : 'No items found'}
            </Text>
          </View>
        }
      />

      {/* Item Detail Modal */}
      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            <Text style={styles.modalPrice}>KSh {selectedItem?.price?.toFixed(2)}</Text>
            {selectedItem?.description && (
              <Text style={styles.modalDescription}>{selectedItem.description}</Text>
            )}

            <Text style={styles.modalLabel}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{itemQuantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setItemQuantity(itemQuantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Special requests..."
              value={itemNotes}
              onChangeText={setItemNotes}
              multiline
              numberOfLines={2}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSelectedItem(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAddToCart}>
                <Text style={styles.modalConfirmText}>
                  Add to Order — KSh {((selectedItem?.price || 0) * itemQuantity).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cart / Send to Kitchen Modal */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Table {selectedTableObj?.table_number} — Order</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Text style={styles.cartClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {(cart || []).map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.menuItem?.name}</Text>
                    {item.notes && <Text style={styles.cartItemNotes}>{item.notes}</Text>}
                    <Text style={styles.cartItemPrice}>KSh {((item.menuItem?.price || 0) * item.quantity).toFixed(2)}</Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity onPress={() => updateQuantity(index, item.quantity - 1)}>
                      <Text style={styles.cartActionText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.cartQuantity}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(index, item.quantity + 1)}>
                      <Text style={styles.cartActionText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeFromCart(index)} style={{ marginLeft: 12 }}>
                      <Text style={[styles.cartActionText, { color: '#EF4444' }]}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {(cart || []).length === 0 && (
                <Text style={styles.emptyCartText}>Your order is empty</Text>
              )}
            </ScrollView>

            {(cart || []).length > 0 && (
              <>
                <View style={styles.cartSummary}>
                  <View style={styles.cartSummaryRow}>
                    <Text style={styles.cartSummaryLabel}>Subtotal</Text>
                    <Text style={styles.cartSummaryValue}>KSh {cartTotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.cartSummaryRow}>
                    <Text style={styles.cartSummaryLabel}>VAT (16%)</Text>
                    <Text style={styles.cartSummaryValue}>KSh {(cartTotal * 0.16).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.cartSummaryRow, styles.cartTotalRow]}>
                    <Text style={styles.cartTotalLabel}>Total</Text>
                    <Text style={styles.cartTotalValue}>KSh {(cartTotal * 1.16).toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.sendKitchenButton} onPress={handleSendToKitchen}>
                  <Text style={styles.sendKitchenText}>🔥 Send to Kitchen</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#1F2937',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#D1D5DB', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  content: { flex: 1, padding: 12 },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 4,
  },
  tableCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  tableNumber: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  tableCapacity: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  tableStatus: { fontSize: 12, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  tableOccupied: { fontSize: 11, color: '#EF4444', marginTop: 2 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: '#4B5563' },
  emptyText: { textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 15 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
    gap: 12,
  },
  backButton: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  tableInfo: { flex: 1 },
  tableHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  tableHeaderSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  cartButton: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 24 },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  customerBar: { padding: 12, backgroundColor: '#FFFFFF' },
  customerInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  searchBar: { padding: 12, backgroundColor: '#FFFFFF' },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  categoryBar: { paddingHorizontal: 12, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#1F2937' },
  categoryChipText: { fontSize: 13, color: '#6B7280' },
  categoryChipTextActive: { color: '#FFFFFF', fontWeight: '500' },
  menuGrid: { padding: 8, gap: 8 },
  menuCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuCardDisabled: { opacity: 0.5 },
  menuCardContent: { flex: 1, justifyContent: 'space-between' },
  menuItemName: { fontSize: 14, fontWeight: '600', color: '#1F2937', lineHeight: 20 },
  menuItemPrice: { fontSize: 16, fontWeight: 'bold', color: '#3B82F6', marginTop: 8 },
  unavailableBadge: {
    fontSize: 10,
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
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
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalPrice: { fontSize: 18, color: '#3B82F6', fontWeight: '600', marginTop: 4 },
  modalDescription: { fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  quantityValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', minWidth: 30, textAlign: 'center' },
  notesInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  modalConfirm: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  cartClose: { fontSize: 24, color: '#6B7280', padding: 4 },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  cartItemNotes: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cartItemPrice: { fontSize: 14, color: '#3B82F6', marginTop: 4 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartActionText: { fontSize: 20, color: '#6B7280' },
  cartQuantity: { fontSize: 16, fontWeight: '600', color: '#1F2937', minWidth: 24, textAlign: 'center' },
  emptyCartText: { textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 15 },
  cartSummary: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  cartSummaryLabel: { fontSize: 14, color: '#6B7280' },
  cartSummaryValue: { fontSize: 14, color: '#1F2937' },
  cartTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cartTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  cartTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
  sendKitchenButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  sendKitchenText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
