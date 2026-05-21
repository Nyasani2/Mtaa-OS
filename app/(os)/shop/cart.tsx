import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useShop } from '../../../domains/shop/hooks/useShop';

export default function ShopCart() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, checkout } = useShop();

  const total = cart?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Shopping Cart</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView style={styles.content}>
        {(!cart || cart.length === 0) ? (
          <View style={styles.empty}>
            <FontAwesome5 name="shopping-cart" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(os)/shop/marketplace')}>
              <Text style={styles.browseText}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cart.map((item: any, index: number) => (
              <View key={index} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>KES {item.price?.toLocaleString()}</Text>
                </View>
                <View style={styles.quantity}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                    <FontAwesome5 name="minus" size={14} color="#64748B" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                    <FontAwesome5 name="plus" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <FontAwesome5 name="trash" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>KES {total.toLocaleString()}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={checkout}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  content: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 16 },
  browseBtn: {
    marginTop: 20,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#334155' },
  itemPrice: { fontSize: 13, color: '#64748B', marginTop: 4 },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#334155', minWidth: 24, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#334155' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  checkoutBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
