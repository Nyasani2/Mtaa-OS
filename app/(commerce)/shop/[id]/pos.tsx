// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function POSScreen() {
  const { id: shopId } = useLocalSearchParams();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cart, setCart] = useState([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanning(false);
    await lookupAndAddToCart(data);
  };

  const lookupAndAddToCart = async (barcode: string) => {
    try {
      const { data: item, error } = await supabase
        .from('shop_inventory')
        .select('id, name, barcode, selling_price, quantity')
        .eq('shop_id', shopId)
        .eq('barcode', barcode)
        .single();

      if (error || !item) {
        Alert.alert('Not Found', `No item found with barcode: ${barcode}`);
        return;
      }

      if (item.quantity <= 0) {
        Alert.alert('Out of Stock', `${item.name} is currently out of stock.`);
        return;
      }

      // Add to cart or increment quantity
      setCart(prev => {
        const existing = prev.find((c: any) => c.id === item.id);
        if (existing) {
          if (existing.qty >= item.quantity) {
            Alert.alert('Max Stock', 'Cannot add more than available stock.');
            return prev;
          }
          return prev.map((c: any) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
        }
        return [...prev, { ...item, qty: 1 }];
      });
    } catch (err) {
      console.error('Cart error:', err);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum: number, item: any) => sum + (item.selling_price * item.qty), 0);
    
    const cartPayload = cart.map((item: any) => ({
      item_id: item.id,
      quantity: item.qty,
      unit_price: item.selling_price
    }));

    try {
      const { data, error } = await supabase.rpc('process_shop_sale', {
        p_shop_id: shopId,
        p_cart_items: cartPayload,
        p_total_amount: total,
        p_payment_method: 'cash' // Can be dynamic based on UI
      });

      if (error) throw error;

      Alert.alert('Success', `Sale completed! Total: KES ${total.toFixed(2)}`);
      setCart([]); // Clear cart
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'An error occurred');
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter((item: any) => item.id !== itemId));
  };

  if (hasPermission === null) return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  if (hasPermission === false) return <View style={styles.center}><Text>No access to camera</Text></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Point of Sale</Text>
        <TouchableOpacity onPress={() => setShowManualInput(true)}><Ionicons name="keypad" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {/* Scanner / Cart Area */}
        <View style={styles.scannerContainer}>
          {scanning ? (
            <CameraView 
              style={styles.camera} 
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
              onBarcodeScanned={handleBarCodeScanned} 
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="barcode-outline" size={64} color="#64748b" />
              <Text style={styles.placeholderText}>Tap to Scan Barcode</Text>
            </View>
          )}
          <TouchableOpacity style={styles.scanBtn} onPress={() => setScanning(!scanning)}>
            <Text style={styles.scanBtnText}>{scanning ? 'Stop Scanning' : 'Start Scanning'}</Text>
          </TouchableOpacity>
        </View>

        {/* Cart List */}
        <View style={styles.cartContainer}>
          <Text style={styles.sectionTitle}>Current Sale ({cart.length} items)</Text>
          <FlatList
            data={cart}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: any) => (
              <View style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>KES {item.selling_price} x {item.qty}</Text>
                </View>
                <Text style={styles.itemTotal}>KES {(item.selling_price * item.qty).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>
            KES {cart.reduce((sum: number, item: any) => sum + (item.selling_price * item.qty), 0).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutBtn, cart.length === 0 && styles.disabledBtn]} 
          onPress={handleCheckout}
          disabled={cart.length === 0}
        >
          <Text style={styles.checkoutText}>Complete Sale</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Barcode Input Modal */}
      <Modal visible={showManualInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Barcode Manually</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g., 123456789012" 
              keyboardType="numeric"
              value={manualBarcode}
              onChangeText={setManualBarcode}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => { setShowManualInput(false); setManualBarcode(''); }}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => { lookupAndAddToCart(manualBarcode); setShowManualInput(false); setManualBarcode(''); }}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  mainContent: { flex: 1, flexDirection: 'row', padding: 16, gap: 16 },
  scannerContainer: { width: '40%', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center' },
  camera: { width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' },
  cameraPlaceholder: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8 },
  placeholderText: { color: '#64748b', marginTop: 8 },
  scanBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 12, width: '100%', alignItems: 'center' },
  scanBtnText: { color: '#fff', fontWeight: '600' },
  cartContainer: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12 },
  sectionTitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  itemName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemMeta: { color: '#94a3b8', fontSize: 12 },
  itemTotal: { color: '#22c55e', fontSize: 14, fontWeight: '700', marginRight: 12 },
  removeBtn: { padding: 8 },
  footer: { backgroundColor: '#1e293b', padding: 16, borderTopWidth: 1, borderTopColor: '#334155' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { color: '#94a3b8', fontSize: 16 },
  totalValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  checkoutBtn: { backgroundColor: '#22c55e', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#334155' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, backgroundColor: '#334155', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnPrimary: { flex: 1, backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
