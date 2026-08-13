import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartService, CartItem } from '@/domains/commerce/services/cartService';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, removeItem, updateQuantity, calculateTotals, checkout, loading } = useCartService();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const totals = calculateTotals();

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add items before checkout');
      return;
    }
    setIsCheckingOut(true);
    try {
      const result = await checkout(
        {
          full_name: user?.user_metadata?.full_name || '',
          phone: (user as any)?.phone || '',
          address_line1: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'Kenya',
        },
        'mpesa'
      );
      if (result.success) {
        router.push('/marketplace/order-success' as any);
      } else {
        Alert.alert('Checkout Failed', result.error || 'Unknown error');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart ({items.length})</Text>
        <TouchableOpacity onPress={() => router.push('/marketplace' as any)}>
          <Ionicons name="storefront-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/marketplace' as any)}>
              <Text style={styles.browseBtnText}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item: CartItem) => (
            <View key={item.id} style={styles.itemCard}>
              {item.product_image ? (
                <Image source={{ uri: item.product_image }} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImagePlaceholder}>
                  <Ionicons name="image-outline" size={24} color="#9ca3af" />
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemPrice}>KES {item.unit_price?.toLocaleString()}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={16} color="#374151" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={16} color="#374151" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>KES {totals.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (16%)</Text>
            <Text style={styles.totalValue}>KES {totals.tax.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.totalValue}>{totals.shipping === 0 ? 'FREE' : `KES ${totals.shipping}`}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>KES {totals.total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, (loading || isCheckingOut) && styles.checkoutBtnDisabled]}
            onPress={handleCheckout}
            disabled={loading || isCheckingOut}
          >
            <Text style={styles.checkoutBtnText}>
              {isCheckingOut ? 'Processing...' : 'Checkout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#9ca3af', marginTop: 16, fontSize: 16 },
  browseBtn: { marginTop: 20, backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseBtnText: { color: '#fff', fontWeight: '600' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  itemImage: { width: 64, height: 64, borderRadius: 8 },
  itemImagePlaceholder: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemPrice: { fontSize: 14, color: '#6366f1', fontWeight: '700', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  qtyText: { marginHorizontal: 12, fontSize: 14, fontWeight: '600' },
  removeBtn: { padding: 8 },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  grandTotal: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  checkoutBtn: { backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
