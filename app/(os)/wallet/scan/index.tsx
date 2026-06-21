import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanData(data);

    // Parse QR data — expecting format: mtaa://pay?to=...&amount=...
    try {
      if (data.startsWith('mtaa://')) {
        const url = new URL(data);
        const to = url.searchParams.get('to');
        const amount = url.searchParams.get('amount');
        const till = url.searchParams.get('till');

        if (till) {
          router.push({
            pathname: '/wallet/transfer',
            params: { recipient: till, type: 'till', amount: amount || '' }
          });
        } else if (to) {
          router.push({
            pathname: '/wallet/transfer',
            params: { recipient: to, type: 'wallet', amount: amount || '' }
          });
        }
      } else {
        Alert.alert('QR Scanned', `Data: ${data}`, [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } catch {
      Alert.alert('Invalid QR', 'This QR code is not a valid MTAA payment code.', [
        { text: 'Scan Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.subtitle}>We need camera access to scan QR codes for payments.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan to Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
          </View>
          {scanned && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.scanningText}>Processing...</Text>
            </View>
          )}
        </CameraView>
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>Align QR code within the frame to scan</Text>
        {scanned && (
          <TouchableOpacity style={styles.scanAgainBtn} onPress={() => setScanned(false)}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#9ca3af', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
  btn: { backgroundColor: '#6366f1', marginHorizontal: 32, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cameraContainer: { flex: 1, margin: 16, borderRadius: 24, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#6366f1', borderRadius: 16, backgroundColor: 'transparent' },
  scanningOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  scanningText: { color: '#fff', marginTop: 12, fontSize: 16 },
  footer: { padding: 24, alignItems: 'center' },
  hint: { color: '#9ca3af', fontSize: 14 },
  scanAgainBtn: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  scanAgainText: { color: '#fff', fontWeight: '600' },
});
