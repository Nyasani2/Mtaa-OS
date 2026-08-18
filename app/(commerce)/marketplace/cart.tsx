// @ts-nocheck
// app/(os)/marketplace/cart.tsx
// Cart Screen — view cart, adjust quantities, proceed to checkout

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { cartService, CartItem } from '@/lib/marketplace/services/cart.service';
import { useMarketplaceStore } from '@/lib/marketplace/state/marketplace.store';

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
      let items: any[] = [];
      if (user) {
        const { data: myCarts } = await supabase.from('carts').select('id').eq('user_id', user.id);
        const ids = (myCarts || []).map((c: any) => c.id);
        if (ids.length) {
          const { data: rows } = await supabase.from('cart_items').select('*, products(name, images, selling_price)').in('cart_id', ids);
          items = (rows || []).map((i: any) => ({ ...i, listing_id: i.product_id, quantity: i.qty, product_name: i.products?.name, product_image: i.products?.images?.[0] || null, unit_price: i.unit_price ?? i.products?.selling_price ?? 0, currency: 'KES', seller_name: i.seller_name || '', listing_title: i.products?.name }));
        }
      }
    setCartItems(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdating(itemId);
    const res = await cartService.updateQuantity(itemId, newQty);
    setUpdating(null);
    if (res.success) {
      loadCart();
    } else {
      Alert.alert('Error', res.error || 'Could not update quantity');
    }
  };

  const handleRemove = async (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUpdating(itemId);
            const res = await cartService.removeFromCart(itemId);
            setUpdating(null);
            if (res.success) {
              loadCart();
            }
          },
        },
      ]
    );
  };

    
  const totals = cartService.calculateTotals(cartItems);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Browse the marketplace to add items</Text>
    
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/marketplace' as any)}>
            <Text style={styles.browseBtnText}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart ({cartItems.length})</Text>
          <TouchableOpacity onPress={() => cartService.clearCart().then(loadCart)}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Items */}
        {cartItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Image
    
    
              source={{ uri: item.product_image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
    
    
              <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
              <Text style={styles.itemSeller}>{item.seller_name || 'Unknown seller'}</Text>
              <Text style={styles.itemPrice}>
                {item.currency} {item.unit_price.toLocaleString()}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                  disabled={updating === item.id}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                  disabled={updating === item.id}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>
                {item.currency} {(item.unit_price * item.quantity).toLocaleString()}
              </Text>
              <TouchableOpacity onPress={() => handleRemove(item.id)}>
                <Text style={styles.removeLink}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>KES {totals.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Platform Fee (2.5%)</Text>
            <Text style={styles.totalValueFee}>KES {totals.platformFee.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.totalValue}>KES {totals.shippingTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelFinal}>Total</Text>
            <Text style={styles.totalValueFinal}>KES {totals.total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={styles.checkoutBtn}
    
          onPress={() => router.push({
            pathname: '/(os)/marketplace/checkout',
            params: { total: totals.total.toString() }
          })}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutBtnSub}>KES {totals.total.toLocaleString()}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16, paddingBottom: 40 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 12 },

  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' },
  browseBtn: { backgroundColor: '#007AFF', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  browseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  clearText: { fontSize: 14, color: '#ff3b30' },

  itemCard: { flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14, marginBottom: 12 },
  itemImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#2a2a3e' },
  itemInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#fff', lineHeight: 20 },
  itemSeller: { fontSize: 12, color: '#666', marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#00d26a', marginTop: 6 },
  itemActions: { alignItems: 'flex-end', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f1a', borderRadius: 8, marginBottom: 8 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  qtyText: { fontSize: 14, color: '#fff', fontWeight: '700', minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 6 },
  removeLink: { fontSize: 12, color: '#ff3b30' },

  totalsCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginTop: 8, marginBottom: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalLabel: { fontSize: 14, color: '#888' },
  totalValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  totalValueFee: { fontSize: 14, color: '#f5a623', fontWeight: '600' },
  totalDivider: { height: 1, backgroundColor: '#2a2a3e', marginVertical: 10 },
  totalLabelFinal: { fontSize: 16, fontWeight: '700', color: '#fff' },
  totalValueFinal: { fontSize: 18, fontWeight: '800', color: '#00d26a' },

  checkoutBtn: { backgroundColor: '#007AFF', borderRadius: 16, padding: 18, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  checkoutBtnSub: { color: '#fff', fontSize: 13, opacity: 0.8, marginTop: 4 },
});
