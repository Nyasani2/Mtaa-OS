import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';

interface CartItem {
  inventory_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch_number: string;
  qr_scanned: boolean;
}

export default function POSScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { staffRecord } = useHealthRole();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [patientPhone, setPatientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mtaa_wallet');

  const facilityId = staffRecord?.facility_id;

  // Simulate QR scan (in production, this would use camera + barcode scanner)
  const handleQrScan = useCallback(async (qrData: string) => {
    setScanning(true);
    try {
      // Parse QR data
      let qrJson;
      try {
        qrJson = JSON.parse(qrData);
      } catch {
        Alert.alert('Invalid QR', 'The scanned QR code is not valid');
        return;
      }

      // Check if already in cart
      if (cart.find(item => item.inventory_id === qrJson.i)) {
        // Increment quantity
        setCart(prev => prev.map(item =>
          item.inventory_id === qrJson.i
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
            : item
        ));
        Alert.alert('Added', `${qrJson.n} quantity increased`);
        return;
      }

      // Add to cart
      const newItem: CartItem = {
        inventory_id: qrJson.i,
        name: qrJson.n,
        quantity: 1,
        unit_price: parseFloat(qrJson.p) || 0,
        total_price: parseFloat(qrJson.p) || 0,
        batch_number: qrJson.b || '',
        qr_scanned: true,
      };

      setCart(prev => [...prev, newItem]);
      Alert.alert('Scanned', `${qrJson.n} added to cart`);
    } finally {
      setScanning(false);
      setQrInput('');
    }
  }, [cart]);

  const removeFromCart = (inventoryId: string) => {
    setCart(prev => prev.filter(item => item.inventory_id !== inventoryId));
  };

  const updateQuantity = (inventoryId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.inventory_id !== inventoryId) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty, total_price: newQty * item.unit_price };
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const tax = subtotal * 0.16; // 16% VAT
  const total = subtotal + tax;

  const handlePayment = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please scan at least one item');
      return;
    }

    if (!patientPhone) {
      Alert.alert('Patient Required', 'Please enter patient phone number');
      return;
    }

    setLoading(true);
    try {
      // Process each item
      for (const item of cart) {
        const { data, error } = await supabase.rpc('process_pos_payment', {
          p_qr_data: JSON.stringify({
            v: '1', t: 'health_pos', f: facilityId, i: item.inventory_id,
            n: item.name, p: item.unit_price, b: item.batch_number
          }),
          p_patient_id: user?.id,
          p_quantity: item.quantity,
          p_payment_method: paymentMethod,
        });

        if (error) throw error;
        if (!data?.success) {
          Alert.alert('Payment Failed', data?.error || 'Unknown error');
          return;
        }
      }

      Alert.alert(
        'Payment Successful',
        `Total: KES ${total.toFixed(2)}\n\nItems dispensed: ${cart.length}\nPayment method: ${paymentMethod}`,
        [{ text: 'New Sale', onPress: () => setCart([]) }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!facilityId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No facility assigned. Please contact admin.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacy POS</Text>
        <Text style={styles.headerSubtitle}>
          {staffRecord?.facility?.name || 'Facility'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* QR Scanner Section */}
        <View style={styles.scanSection}>
          <Text style={styles.sectionTitle}>Scan Product QR</Text>
          <View style={styles.scanInputRow}>
            <TextInput
              style={styles.scanInput}
              value={qrInput}
              onChangeText={setQrInput}
              placeholder="Paste QR data or scan..."
              multiline
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => qrInput && handleQrScan(qrInput)}
              disabled={scanning || !qrInput}
            >
              {scanning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.scanButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.scanHint}>
            In production: Camera opens here to scan product QR codes
          </Text>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <TextInput
            style={styles.input}
            value={patientPhone}
            onChangeText={setPatientPhone}
            placeholder="Patient phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Cart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cart ({cart.length} items)</Text>
          {cart.length === 0 ? (
            <Text style={styles.emptyText}>Scan products to add to cart</Text>
          ) : (
            cart.map(item => (
              <View key={item.inventory_id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemBatch}>Batch: {item.batch_number}</Text>
                  <Text style={styles.cartItemPrice}>KES {item.unit_price.toFixed(2)} each</Text>
                </View>
                <View style={styles.cartItemActions}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(item.inventory_id, -1)}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(item.inventory_id, 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.inventory_id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartItemTotal}>KES {item.total_price.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {[
              { value: 'mtaa_wallet', label: 'MTAA Wallet', icon: '💳' },
              { value: 'cash', label: 'Cash', icon: '💵' },
              { value: 'mpesa', label: 'M-Pesa', icon: '📱' },
              { value: 'insurance', label: 'Insurance', icon: '🏥' },
            ].map(method => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentMethod,
                  paymentMethod === method.value && styles.paymentMethodActive
                ]}
                onPress={() => setPaymentMethod(method.value)}
              >
                <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                <Text style={[
                  styles.paymentMethodText,
                  paymentMethod === method.value && styles.paymentMethodTextActive
                ]}>{method.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>KES {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (16%)</Text>
            <Text style={styles.totalValue}>KES {tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>KES {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (loading || cart.length === 0) && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading || cart.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay KES {total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#0A7B5A', paddingTop: 60 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#E0F2E9', marginTop: 2 },
  content: { flex: 1 },
  scanSection: { padding: 16, backgroundColor: '#fff', margin: 12, borderRadius: 12 },
  section: { padding: 16, backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1a1a1a' },
  scanInputRow: { flexDirection: 'row', gap: 8 },
  scanInput: {
    flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12,
    fontSize: 13, borderWidth: 1, borderColor: '#ddd', minHeight: 50
  },
  scanButton: {
    backgroundColor: '#0A7B5A', paddingHorizontal: 20, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center'
  },
  scanButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scanHint: { fontSize: 11, color: '#999', marginTop: 8, fontStyle: 'italic' },
  input: {
    backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#ddd'
  },
  emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  cartItemBatch: { fontSize: 11, color: '#999', marginTop: 2 },
  cartItemPrice: { fontSize: 13, color: '#666', marginTop: 2 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 28, height: 28, backgroundColor: '#f0f0f0', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center'
  },
  qtyButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  qtyText: { fontSize: 15, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeButton: { marginLeft: 8 },
  removeButtonText: { fontSize: 16, color: '#e74c3c' },
  cartItemTotal: { fontSize: 15, fontWeight: '600', color: '#0A7B5A', marginLeft: 12, minWidth: 80, textAlign: 'right' },
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentMethod: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd'
  },
  paymentMethodActive: { backgroundColor: '#0A7B5A', borderColor: '#0A7B5A' },
  paymentMethodIcon: { fontSize: 18 },
  paymentMethodText: { fontSize: 13, color: '#333' },
  paymentMethodTextActive: { color: '#fff', fontWeight: '500' },
  totalsSection: { padding: 16, backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 14, color: '#333' },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8, paddingTop: 12 },
  grandTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  grandTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#0A7B5A' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  payButton: {
    backgroundColor: '#0A7B5A', padding: 16, borderRadius: 12,
    alignItems: 'center'
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { textAlign: 'center', marginTop: 100, fontSize: 16, color: '#e74c3c' },
});
