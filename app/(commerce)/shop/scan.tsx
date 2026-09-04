// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, Ionicons } from '@expo/vector-icons';
import { Alert, shopService } from '@/domains/shop/services/shopService';
import { supabase } from '@/lib/supabase/client';

/**
 * Unified Scan Screen
 * Mode: 'sell' → Add scanned product to POS cart
 * Mode: 'inventory' → Create or edit product by barcode
 */
export default function ShopScanScreen() {
  const router = useRouter();
  const { shopId, mode = 'sell' } = useLocalSearchParams<{ shopId: string; mode: 'sell' | 'inventory' }>();

  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  // Inventory form state
  const [invName, setInvName] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invStock, setInvStock] = useState('');
  const [invCategory, setInvCategory] = useState('');

  const isSellMode = mode === 'sell';

  async function lookupProduct(code: string) {
    if (!code.trim() || !shopId) return;
    setLoading(true);
    try {
      // Try barcode first
      let found = await shopService.getProductByBarcode(shopId, code);

      // Try QR code if no barcode match
      if (!found) {
        const { data } = await supabase
          .from('shop_products')
          .select('*')
          .eq('shop_id', shopId)
          .eq('qr_code', code)
          .maybeSingle();
        found = data;
      }

      if (found) {
        setProduct(found);
        if (isSellMode) {
          // Auto-add to cart and go back
          Alert.alert(
            'Product Found',
            `${found.name} — KES ${found.base_price?.toLocaleString()}`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setProduct(null) },
              {
                text: 'Add to Cart',
                onPress: () => {
                  // Return to POS with product to add
                  router.back();
                  // The POS screen should handle params, but for now we navigate
                },
              },
            ]
          );
        }
      } else {
        setProduct(null);
        if (isSellMode) {
          Alert.alert('Not Found', 'No product matches this code.');
        } else {
          // Inventory mode: prompt to create
          setInvName('');
          setInvPrice('');
          setInvStock('');
          setInvCategory('');
          setShowInventoryModal(true);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProduct() {
    if (!invName.trim() || !invPrice.trim()) {
      Alert.alert('Required', 'Name and price are required');
      return;
    }
    setLoading(true);
    try {
      const newProduct = await shopService.createProduct({
        shop_id: shopId,
        name: invName.trim(),
        base_price: parseFloat(invPrice),
        stock_quantity: parseInt(invStock || '0', 10),
        category: invCategory || 'general',
        barcode: barcode,
        qr_code: barcode,
        is_active: true,
      });
      setShowInventoryModal(false);
      setProduct(newProduct);
      Alert.alert('Created', `${newProduct.name} added to inventory.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  // Simulate scan with manual entry
  function handleManualSubmit() {
    if (barcode.trim()) {
      lookupProduct(barcode.trim());
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSellMode ? 'Scan to Sell' : 'Scan to Inventory'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Scan Area */}
      <View style={styles.scanArea}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Ionicons name="scan" size={64} color="#2196F3" style={{ opacity: 0.3 }} />
        </View>
        <Text style={styles.scanHint}>
          {isSellMode
            ? 'Point camera at product barcode or QR'
            : 'Scan barcode to add or update product'}
        </Text>
      </View>

      {/* Manual Entry */}
      <View style={styles.manualSection}>
        <Text style={styles.manualLabel}>Or enter code manually</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="Barcode / QR code"
            value={barcode}
            onChangeText={setBarcode}
            autoCapitalize="none"
            onSubmitEditing={handleManualSubmit}
          />
          <TouchableOpacity style={styles.manualBtn} onPress={handleManualSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="search" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Last Scanned */}
      {product && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Last Scanned</Text>
          <Text style={styles.resultName}>{product.name}</Text>
          <Text style={styles.resultPrice}>KES {product.base_price?.toLocaleString()}</Text>
          <Text style={styles.resultStock}>Stock: {product.stock_quantity || 0}</Text>
          {isSellMode && (
            <TouchableOpacity
              style={styles.resultAction}
              onPress={() => {
                // Navigate back to POS with this product pre-selected
                router.back();
              }}
            >
              <Text style={styles.resultActionText}>Add to POS Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Inventory Create Modal */}
      <Modal visible={showInventoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Product</Text>
            <Text style={styles.modalSub}>Barcode: {barcode}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Product name *"
              value={invName}
              onChangeText={setInvName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Price (KES) *"
              keyboardType="numeric"
              value={invPrice}
              onChangeText={setInvPrice}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Stock quantity"
              keyboardType="numeric"
              value={invStock}
              onChangeText={setInvStock}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Category"
              value={invCategory}
              onChangeText={setInvCategory}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowInventoryModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreateProduct} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(33,150,243,0.3)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#2196F3' },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  scanHint: { color: 'rgba(255,255,255,0.6)', marginTop: 20, fontSize: 14 },
  manualSection: { padding: 20, backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  manualLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: { flex: 1, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  manualBtn: { backgroundColor: '#2196F3', width: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultCard: { margin: 16, padding: 16, backgroundColor: '#1E293B', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  resultLabel: { color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  resultName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resultPrice: { color: '#2196F3', fontSize: 16, fontWeight: '700', marginTop: 4 },
  resultStock: { color: '#64748B', fontSize: 13, marginTop: 2 },
  resultAction: { marginTop: 12, backgroundColor: '#2196F3', padding: 12, borderRadius: 10, alignItems: 'center' },
  resultActionText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '600' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2196F3', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});
