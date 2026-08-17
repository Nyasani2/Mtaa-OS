import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { shopService } from '@/domains/shop/services/shopService';
import { posService, POSStaff } from '@/domains/shop/services/posService';

interface CartItem {
  product: any;
  quantity: number;
}

export default function POSTerminalScreen() {
  const router = useRouter();
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [session, setSession] = useState<any>(null);
  const [staff, setStaff] = useState<POSStaff | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sell' | 'session'>('sell');

  const loadProducts = useCallback(async () => {
    if (!shopId) return;
    const data = await shopService.getProducts(shopId);
    setProducts(data);
  }, [shopId]);

  const checkActiveSession = useCallback(async () => {
    if (!shopId) return;
    const active = await posService.getActiveSession(shopId);
    if (active) {
      setSession(active);
      // Load staff name
      const staffList = await posService.getShopStaff(shopId);
      const s = staffList.find((st) => st.id === active.staff_id);
      if (s) setStaff(s);
    }
  }, [shopId]);

  useEffect(() => {
    loadProducts();
    checkActiveSession();
  }, [loadProducts, checkActiveSession]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.base_price * item.quantity, 0);

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      })
    );
  }

  async function handleStaffLogin() {
    if (!shopId || !pin) return;
    setLoading(true);
    try {
      const verified = await posService.verifyStaffPin(shopId, pin);
      if (!verified) {
        Alert.alert('Invalid PIN', 'Please check your staff PIN and try again.');
        setLoading(false);
        return;
      }
      const newSession = await posService.startSession(shopId, verified.id, 0);
      setSession(newSession);
      setStaff(verified);
      setShowPinModal(false);
      setPin('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseSession() {
    if (!session) return;
    Alert.alert('Close Session', 'Enter closing cash amount?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        onPress: async () => {
          try {
            await posService.closeSession(session.id, cartTotal);
            setSession(null);
            setStaff(null);
            setCart([]);
            Alert.alert('Session Closed', 'POS session closed successfully.');
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  function handleCheckout(method: 'wallet' | 'cash' | 'card') {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items before checkout.');
      return;
    }
    if (method === 'cash') {
      setShowCashModal(true);
      return;
    }
    // Navigate to checkout screen
    router.push({
      pathname: '/(commerce)/shop/checkout',
      params: {
        shopId,
        posSessionId: session?.id,
        paymentMethod: method,
        cart: JSON.stringify(cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.base_price,
          total_price: i.product.base_price * i.quantity,
        }))),
        total: cartTotal.toString(),
      },
    } as any);
  }

  function handleCashCheckout() {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < cartTotal) {
      Alert.alert('Insufficient Cash', `Received KES ${received || 0} but total is KES ${cartTotal}`);
      return;
    }
    const change = received - cartTotal;
    setShowCashModal(false);
    setCashReceived('');
    // Navigate to checkout with cash method
    router.push({
      pathname: '/(commerce)/shop/checkout',
      params: {
        shopId,
        posSessionId: session?.id,
        paymentMethod: 'cash',
        cart: JSON.stringify(cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.base_price,
          total_price: i.product.base_price * i.quantity,
        }))),
        total: cartTotal.toString(),
        cashReceived: received.toString(),
        cashChange: change.toString(),
      },
    } as any);
  }

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Ionicons name="lock-closed" size={48} color="#2196F3" />
          <Text style={styles.loginTitle}>POS Locked</Text>
          <Text style={styles.loginSub}>Enter your staff PIN to open the register</Text>

          <View style={styles.pinDisplay}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
            ))}
          </View>

          <View style={styles.keypad}>
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['C', '0', '⌫']].map((row, ri) => (
              <View key={ri} style={styles.keypadRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.keypadBtn, key === '' && { opacity: 0 }]}
                    onPress={() => {
                      if (key === 'C') setPin('');
                      else if (key === '⌫') setPin((p) => p.slice(0, -1));
                      else if (pin.length < 4) setPin((p) => p + key);
                    }}
                    disabled={key === ''}
                  >
                    <Text style={styles.keypadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, pin.length !== 4 && styles.loginBtnDisabled]}
            onPress={handleStaffLogin}
            disabled={pin.length !== 4 || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Unlock POS</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>POS Terminal</Text>
          <Text style={styles.headerSub}>Staff: {staff?.name || 'Unknown'} • Session Active</Text>
        </View>
        <TouchableOpacity onPress={handleCloseSession} style={styles.closeSessionBtn}>
          <Text style={styles.closeSessionText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Scan */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or enter barcode..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => router.push({ pathname: '/(commerce)/shop/scan', params: { shopId, mode: 'sell' } } as any)}
        >
          <Ionicons name="barcode" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageText}>📦</Text>
            </View>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>KES {item.base_price?.toLocaleString()}</Text>
            <Text style={styles.productStock}>Stock: {item.stock_quantity || 0}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found</Text>}
      />

      {/* Cart Drawer */}
      {cart.length > 0 && (
        <View style={styles.cartPanel}>
          <ScrollView style={styles.cartList} horizontal={false}>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>KES {(item.product.base_price * item.quantity).toLocaleString()}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.cartFooter}>
            <Text style={styles.cartTotal}>Total: KES {cartTotal.toLocaleString()}</Text>
            <View style={styles.payRow}>
              <TouchableOpacity style={[styles.payBtn, styles.payCash]} onPress={() => handleCheckout('cash')}>
                <Text style={styles.payBtnText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.payBtn, styles.payWallet]} onPress={() => handleCheckout('wallet')}>
                <Text style={styles.payBtnText}>Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.payBtn, styles.payCard]} onPress={() => handleCheckout('card')}>
                <Text style={styles.payBtnText}>Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Cash Modal */}
      <Modal visible={showCashModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cash Payment</Text>
            <Text style={styles.modalSub}>Total: KES {cartTotal.toLocaleString()}</Text>
            <TextInput
              style={styles.cashInput}
              placeholder="Cash received"
              keyboardType="numeric"
              value={cashReceived}
              onChangeText={setCashReceived}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCashModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCashCheckout}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loginContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loginTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 16 },
  loginSub: { fontSize: 14, color: '#64748B', marginTop: 8, marginBottom: 24 },
  pinDisplay: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#CBD5E1' },
  pinDotFilled: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  keypad: { width: 280 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  keypadBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  keypadText: { fontSize: 24, fontWeight: '600', color: '#0F172A' },
  loginBtn: { marginTop: 24, backgroundColor: '#2196F3', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  loginBtnDisabled: { opacity: 0.4 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#fff' },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeSessionBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  closeSessionText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 14 },
  scanBtn: { backgroundColor: '#2196F3', width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  productGrid: { padding: 12, paddingBottom: 300 },
  productCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, margin: 6, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 160 },
  productImagePlaceholder: { height: 80, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  productImageText: { fontSize: 32 },
  productName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#2196F3', marginTop: 4 },
  productStock: { fontSize: 11, color: '#64748B', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94A3B8', padding: 40 },
  cartPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', maxHeight: '45%' },
  cartList: { padding: 16, maxHeight: 200 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  cartItemPrice: { fontSize: 12, color: '#64748B', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#0F172A', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 8, padding: 4 },
  cartFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  cartTotal: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  payRow: { flexDirection: 'row', gap: 8 },
  payBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  payCash: { backgroundColor: '#10B981' },
  payWallet: { backgroundColor: '#2196F3' },
  payCard: { backgroundColor: '#8B5CF6' },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 16 },
  cashInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '600' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2196F3', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});
