// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartService } from '@/lib/marketplace/services/cart.service';

const PAYMENT_METHODS = [
  { key: 'wallet', label: 'Wallet Balance', icon: '💰' },
  { key: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { key: 'mobile_money', label: 'Mobile Money', icon: '📱' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { total } = useLocalSearchParams();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [notes, setNotes] = useState('');
  const [kycWarning, setKycWarning] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const items = await cartService.getCart();
    setCartItems(items);
    const numTotal = parseFloat(total as string) || 0;
    if (numTotal > 10000) {
      try {
        const wd = require('@/domains/wallet/services/withdrawService').default;
        const kyc = await wd?.checkKycLevel?.();
        setKycWarning(kyc ? !kyc.eligible : false);
      } catch { setKycWarning(false); }
    }
    setLoading(false);
  };

  const validateForm = () => {
    if (!fullName.trim()) return 'Enter full name';
    if (!phone.trim()) return 'Enter phone number';
    if (!address1.trim()) return 'Enter address';
    if (!city.trim()) return 'Enter city';
    if (!state.trim()) return 'Enter state/province';
    return null;
  };

  const handleCheckout = async () => {
    const err = validateForm();
    if (err) { Alert.alert('Missing Information', err); return; }
    if (kycWarning) {
      Alert.alert('KYC Required', 'This purchase exceeds 10,000. KYC Level 2 is required.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Verify Identity', onPress: () => router.push('/(os)/wallet/kyc' as any) },
      ]);
      return;
    }
    setSubmitting(true);
    const result = await cartService.checkout({
      items: cartItems,
      shipping_address: { full_name: fullName, phone, address_line1: address1, address_line2: address2 || undefined, city, state, postal_code: postalCode, country },
      payment_method: paymentMethod as any,
      currency: cartItems[0]?.currency || 'KES',
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (result.success) {
      router.push({ pathname: '/(os)/marketplace/order-success', params: { order_id: result.order_id, total: result.total?.toString() } });
    } else if (result.code === 'INSUFFICIENT_FUNDS') {
      Alert.alert('Insufficient Balance', 'Add funds to your wallet to complete this purchase.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Funds', onPress: () => router.push('/(os)/wallet/deposit' as any) },
      ]);
    } else {
      Alert.alert('Checkout Failed', result.error || 'Could not complete purchase');
    }
  };

  const totals = cartService.calculateTotals(cartItems);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>Preparing checkout...</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 30 }} />
        </View>

        {kycWarning && (
          <View style={styles.kycBanner}>
            <Text style={styles.kycBannerIcon}>⚠️</Text>
            <View style={styles.kycBannerContent}>
              <Text style={styles.kycBannerTitle}>KYC Verification Required</Text>
              <Text style={styles.kycBannerText}>Purchases over 10,000 require Level 2 identity verification.</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(os)/wallet/kyc' as any)}><Text style={styles.kycBannerAction}>Verify →</Text></TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryItem}>{item.product_name} x{item.quantity}</Text>
              <Text style={styles.summaryPrice}>{item.currency} {(item.unit_price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{totals.subtotal.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Platform Fee</Text><Text style={styles.summaryValueFee}>{totals.platformFee.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Shipping</Text><Text style={styles.summaryValue}>{totals.shippingTotal.toLocaleString()}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Total</Text><Text style={styles.summaryTotalValue}>{totals.total.toLocaleString()}</Text></View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Address Line 1" placeholderTextColor="#666" value={address1} onChangeText={setAddress1} />
          <TextInput style={styles.input} placeholder="Address Line 2 (optional)" placeholderTextColor="#666" value={address2} onChangeText={setAddress2} />
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="City" placeholderTextColor="#666" value={city} onChangeText={setCity} />
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="State/Province" placeholderTextColor="#666" value={state} onChangeText={setState} />
          </View>
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Postal Code" placeholderTextColor="#666" value={postalCode} onChangeText={setPostalCode} />
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Country" placeholderTextColor="#666" value={country} onChangeText={setCountry} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity key={m.key} style={[styles.methodRow, paymentMethod === m.key && styles.methodRowActive]} onPress={() => setPaymentMethod(m.key)}>
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={[styles.methodLabel, paymentMethod === m.key && styles.methodLabelActive]}>{m.label}</Text>
              {paymentMethod === m.key && <Text style={styles.methodCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Notes (optional)</Text>
          <TextInput style={[styles.input, styles.notesInput]} placeholder="Special instructions for seller..." placeholderTextColor="#666" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        </View>

        <TouchableOpacity style={[styles.checkoutBtn, submitting && styles.checkoutBtnDisabled]} onPress={handleCheckout} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.checkoutBtnText}>Place Order</Text>
              <Text style={styles.checkoutBtnSub}>KES {totals.total.toLocaleString()}</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.termsText}>By placing this order, you agree to our Terms of Service and Marketplace Policies.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16, paddingBottom: 40 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  kycBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a1a0a', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#f5a623' },
  kycBannerIcon: { fontSize: 24, marginRight: 12 },
  kycBannerContent: { flex: 1 },
  kycBannerTitle: { fontSize: 14, fontWeight: '700', color: '#f5a623', marginBottom: 4 },
  kycBannerText: { fontSize: 12, color: '#cc9966', lineHeight: 18 },
  kycBannerAction: { fontSize: 13, color: '#f5a623', fontWeight: '700', marginLeft: 8 },
  sectionCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 18, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryItem: { fontSize: 13, color: '#ccc', flex: 1 },
  summaryPrice: { fontSize: 13, color: '#fff', fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#2a2a3e', marginVertical: 10 },
  summaryLabel: { fontSize: 14, color: '#888' },
  summaryValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  summaryValueFee: { fontSize: 14, color: '#f5a623', fontWeight: '600' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#00d26a' },
  input: { backgroundColor: '#0f0f1a', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 10, borderWidth: 1, borderColor: '#2a2a3e' },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#0f0f1a', marginBottom: 8, borderWidth: 1, borderColor: '#2a2a3e' },
  methodRowActive: { borderColor: '#007AFF', backgroundColor: '#0d1b3e' },
  methodIcon: { fontSize: 20, marginRight: 12 },
  methodLabel: { fontSize: 14, color: '#ccc', flex: 1 },
  methodLabelActive: { color: '#fff', fontWeight: '600' },
  methodCheck: { fontSize: 16, color: '#007AFF', fontWeight: '700' },
  checkoutBtn: { backgroundColor: '#007AFF', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8 },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  checkoutBtnSub: { color: '#fff', fontSize: 13, opacity: 0.8, marginTop: 4 },
  termsText: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
