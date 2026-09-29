// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ShopQRScanScreen() {
  const { id: shopId } = useLocalSearchParams();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate();

    try {
      const { data: product, error } = await supabase
        .from('shop_inventory')
        .select('*')
        .eq('shop_id', shopId)
        .eq('barcode', data)
        .single();

      if (error || !product) {
        Alert.alert('Not Found', 'Product not found in inventory. Please enter manually.', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
        return;
      }

      Alert.alert('Product Found', `${product.name}\nStock: ${product.quantity}\nPrice: KES ${product.selling_price}`, [
        { text: 'Add to Cart', onPress: () => { /* TODO: Add to cart logic */ setScanned(false); } },
        { text: 'Scan Another', onPress: () => setScanned(false) }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to lookup product');
      setScanned(false);
    }
  };

  if (hasPermission === null) return <View style={styles.center}><Text>Requesting camera...</Text></View>;
  if (hasPermission === false) return <View style={styles.center}><Text>No camera access</Text></View>;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e'] }}>
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Product Barcode</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.scanFrame} />
          <Text style={styles.instruction}>Align barcode or QR code within the frame</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  header: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { padding: 8 }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scanFrame: { width: 280, height: 150, borderWidth: 2, borderColor: '#22c55e', borderRadius: 12 },
  instruction: { color: '#fff', marginTop: 20, fontSize: 16, textAlign: 'center' },
});
