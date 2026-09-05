// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { usePharmacy } from '@/lib/health/hooks/usePharmacy';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ShoppingCart, Plus, Search, X, Minus, Trash2, CreditCard, Wallet, DollarSign, CheckCircle, Printer } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function PharmacyPOSScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet' | 'insurance'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const { inventory, loading, error, refresh, processSale } = usePharmacy(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredInventory = inventory?.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.generic_name?.toLowerCase().includes(q);
  });

  const addToCart = useCallback((item: any) => {
    setCart(prev => {
      const existing = prev.find((c: any) => c.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) { Alert.alert('Out of Stock', 'Cannot add more of this item'); return prev; }
        return prev.map((c: any) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: parseFloat(item.price) || 0, quantity: 1, stock: item.quantity }];
    });
  }, []);

  const updateCartQty = useCallback((itemId: string, delta: number) => {
    setCart(prev => prev.map((c: any) => {
      if (c.id !== itemId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return c;
      if (newQty > c.stock) { Alert.alert('Stock Limit', 'Cannot exceed available stock'); return c; }
      return { ...c, quantity: newQty };
    }).filter((c: any) => c.quantity > 0));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter((c: any) => c.id !== itemId));
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) { Alert.alert('Empty Cart', 'Add items to the cart first'); return; }
    try {
      await processSale({
        items: cart,
        total: cartTotal,
        payment_method: paymentMethod,
        customer_name: customerName,
        customer_phone: customerPhone,
        facility_id: selectedFacilityId,
        cashier_id: user?.id,
      });
      setCart([]);
      setShowCheckout(false);
      setCustomerName('');
      setCustomerPhone('');
      Alert.alert('Success', `Sale completed. Total: $${cartTotal.toFixed(2)}`);
    } catch (err: any) { Alert.alert('Error', err.message || 'Payment failed'); }
  }, [cart, cartTotal, paymentMethod, customerName, customerPhone, selectedFacilityId, user?.id, processSale]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading POS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacy POS</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => cart.length > 0 && setShowCheckout(true)}>
          <ShoppingCart size={22} color={COLORS.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search medicines..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredInventory?.length === 0 ? (
          <View style={styles.emptyState}><ShoppingCart size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No items match' : 'No inventory items'}</Text></View>
        ) : (
          filteredInventory?.map((item: any) => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productGeneric}>{item.generic_name} {item.strength}</Text>
                <View style={styles.productMeta}>
                  <Text style={styles.productPrice}>${(parseFloat(item.price) || 0).toFixed(2)}</Text>
                  <Text style={[styles.productStock, item.quantity <= (item.reorder_level || 0) && { color: COLORS.danger }]}>
                    Stock: {item.quantity} {item.unit}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Plus size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>{cartCount} item{cartCount !== 1 ? 's' : ''}</Text>
            <Text style={styles.cartTotal}>${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowCheckout(true)}>
            <Text style={styles.checkoutText}>Checkout</Text>
            <DollarSign size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCheckout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checkout</Text>
              <TouchableOpacity onPress={() => setShowCheckout(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionLabel}>Cart Items</Text>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>${item.price.toFixed(2)} each</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(item.id, -1)}>
                      <Minus size={14} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(item.id, 1)}>
                      <Plus size={14} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                      <Trash2 size={14} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${cartTotal.toFixed(2)}</Text>
              </View>

              <Text style={styles.sectionLabel}>Customer</Text>
              <TextInput style={styles.input} placeholder="Customer name (optional)" value={customerName} onChangeText={setCustomerName} />
              <TextInput style={styles.input} placeholder="Phone (optional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />

              <Text style={styles.sectionLabel}>Payment Method</Text>
              <View style={styles.paymentRow}>
                {(['cash', 'card', 'wallet', 'insurance'] as const).map((method) => (
                  <TouchableOpacity key={method} style={[styles.paymentBtn, paymentMethod === method && styles.paymentBtnActive]} onPress={() => setPaymentMethod(method)}>
                    {method === 'cash' && <DollarSign size={18} color={paymentMethod === method ? COLORS.white : COLORS.textLight} />}
                    {method === 'card' && <CreditCard size={18} color={paymentMethod === method ? COLORS.white : COLORS.textLight} />}
                    {method === 'wallet' && <Wallet size={18} color={paymentMethod === method ? COLORS.white : COLORS.textLight} />}
                    {method === 'insurance' && <CheckCircle size={18} color={paymentMethod === method ? COLORS.white : COLORS.textLight} />}
                    <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>{method}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.payButton} onPress={handleCheckout}>
                <Text style={styles.payButtonText}>Complete Sale - ${cartTotal.toFixed(2)}</Text>
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
  cartButton: { padding: 8, position: 'relative' },
  cartBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  productGeneric: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  productMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  productPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  productStock: { fontSize: 12, color: COLORS.textLight },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 100 },
  cartBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  cartInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartCount: { fontSize: 14, color: COLORS.textLight },
  cartTotal: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, gap: 6 },
  checkoutText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cartItemPrice: { fontSize: 12, color: COLORS.textLight },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 2, borderTopColor: COLORS.border, marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text, marginBottom: 8 },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  paymentBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paymentText: { fontSize: 12, color: COLORS.textLight, textTransform: 'capitalize' },
  paymentTextActive: { color: COLORS.white, fontWeight: '600' },
  payButton: { backgroundColor: COLORS.success, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  payButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
