// ============================================================================
// MTAA Restaurant Module — POS (Point of Sale) Screen
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { usePos, useMenuSearch, useTables } from '@/lib/restaurant/hooks';

export default function RestaurantPOS() {
  const {
    cart, cartTotal, cartItemCount,
    addToCart, removeFromCart, updateQuantity,
    submitOrder, clearCart, menu, tables
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

  const { tables: tableList, loadTables } = useTables();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet' | 'mpesa'>('cash');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  useEffect(() => {
    menu.loadCategories();
    loadTables();
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedItem) return;
    addToCart(selectedItem, itemQuantity, {}, itemNotes);
    setSelectedItem(null);
    setItemQuantity(1);
    setItemNotes('');
  }, [selectedItem, itemQuantity, itemNotes, addToCart]);

  const handleSubmitOrder = async () => {
    try {
      const order = await submitOrder(
        orderType === 'dine_in' ? selectedTable || undefined : undefined,
        orderType
      );
      Alert.alert('Success', `Order #${order.order_number} created!`);
      setShowCart(false);
      setShowPayment(false);
      setSelectedTable(null);
      setCustomerNotes('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handlePayment = async () => {
    if (!cart.length) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }
    setShowPayment(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>POS</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Order Type Selector */}
      <View style={styles.typeSelector}>
        {(['dine_in', 'takeaway', 'delivery'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, orderType === type && styles.typeButtonActive]}
            onPress={() => setOrderType(type)}
          >
            <Text style={[styles.typeButtonText, orderType === type && styles.typeButtonTextActive]}>
              {type === 'dine_in' ? '🍽️ Dine-in' : type === 'takeaway' ? '🥡 Takeaway' : '🛵 Delivery'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Table Selector (Dine-in only) */}
      {orderType === 'dine_in' && (
        <View style={styles.tableSection}>
          <Text style={styles.sectionLabel}>Select Table</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(tableList || []).filter(t => t.status === 'available').map((table) => (
              <TouchableOpacity
                key={table.id}
                style={[styles.tableChip, selectedTable === table.id && styles.tableChipActive]}
                onPress={() => setSelectedTable(table.id)}
              >
                <Text style={[styles.tableChipText, selectedTable === table.id && styles.tableChipTextActive]}>
                  {table.table_number} ({table.capacity}p)
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
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

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarItems}>{cartItemCount} items</Text>
          <Text style={styles.bottomBarTotal}>KSh {cartTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, cartItemCount === 0 && styles.checkoutButtonDisabled]}
          onPress={handlePayment}
          disabled={cartItemCount === 0}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>

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
                  Add — KSh {((selectedItem?.price || 0) * itemQuantity).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Your Order</Text>
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
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
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

                <TouchableOpacity style={styles.placeOrderButton} onPress={handleSubmitOrder}>
                  <Text style={styles.placeOrderText}>Place Order</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  topBarTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
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
  typeSelector: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: '#3B82F6' },
  typeButtonText: { fontSize: 13, color: '#4B5563' },
  typeButtonTextActive: { color: '#FFFFFF', fontWeight: '600' },
  tableSection: { padding: 12, backgroundColor: '#FFFFFF' },
  sectionLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  tableChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  tableChipActive: { backgroundColor: '#10B981' },
  tableChipText: { fontSize: 13, color: '#4B5563' },
  tableChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomBarInfo: { flex: 1 },
  bottomBarItems: { fontSize: 13, color: '#6B7280' },
  bottomBarTotal: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  checkoutButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  checkoutButtonDisabled: { backgroundColor: '#D1D5DB' },
  checkoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
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
  cartTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
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
  placeOrderButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  placeOrderText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
