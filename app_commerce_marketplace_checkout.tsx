import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartService } from '@/domains/commerce/services/cartService';
import { requestWithdrawal } from '@/domains/wallet/services/withdrawService';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, calculateTotals, checkout, loading: cartLoading } = useCartService();
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: (user as any)?.phone || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Kenya',
  });

  const totals = calculateTotals();

  const handlePlaceOrder = async () => {
    if (!shipping.full_name || !shipping.phone || !shipping.address_line1) {
      Alert.alert('Missing Info', 'Please fill in all required shipping details');
      return;
    }
    setLoading(true);
    try {
      const result = await checkout(shipping, 'mpesa');
      if (result.success) {
        router.push('/marketplace/order-success' as any);
      } else {
        Alert.alert('Order Failed', result.error || 'Please try again');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Full Name" value={shipping.full_name} onChangeText={(t) => setShipping({ ...shipping, full_name: t })} />
          <TextInput style={styles.input} placeholder="Phone" value={shipping.phone} onChangeText={(t) => setShipping({ ...shipping, phone: t })} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Address Line 1" value={shipping.address_line1} onChangeText={(t) => setShipping({ ...shipping, address_line1: t })} />
          <TextInput style={styles.input} placeholder="Address Line 2 (Optional)" value={shipping.address_line2} onChangeText={(t) => setShipping({ ...shipping, address_line2: t })} />
          <TextInput style={styles.input} placeholder="City" value={shipping.city} onChangeText={(t) => setShipping({ ...shipping, city: t })} />
          <TextInput style={styles.input} placeholder="State/County" value={shipping.state} onChangeText={(t) => setShipping({ ...shipping, state: t })} />
          <TextInput style={styles.input} placeholder="Postal Code" value={shipping.postal_code} onChangeText={(t) => setShipping({ ...shipping, postal_code: t })} keyboardType="number-pad" />
        </View>

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text>Subtotal</Text><Text>KES {totals.subtotal.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text>Tax</Text><Text>KES {totals.tax.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text>Shipping</Text><Text>{totals.shipping === 0 ? 'FREE' : `KES ${totals.shipping}`}</Text></View>
          <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>KES {totals.total.toLocaleString()}</Text></View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.placeOrderBtn, loading && styles.placeOrderBtnDisabled]} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeOrderBtnText}>Place Order</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scroll: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 12 },
  form: { gap: 10 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  placeOrderBtn: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
