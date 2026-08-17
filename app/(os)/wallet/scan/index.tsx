import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'payment') {
        router.push({
          pathname: '/(os)/wallet/qr-pay',
          params: { recipient: parsed.recipient, amount: parsed.amount }
        });
      } else if (parsed.type === 'escrow') {
        router.push({
          pathname: '/(os)/wallet/escrow',
          params: { escrowId: parsed.escrowId }
        });
      } else {
        router.push({
          pathname: '/(os)/wallet/qr-action',
          params: { data }
        });
      }
    } catch {
      // Not JSON — treat as plain QR data
      router.push({
        pathname: '/(os)/wallet/qr-action',
        params: { data }
      });
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color="#8E8E93" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          <Text style={styles.hint}>Align QR code within the frame</Text>

          {scanned && (
            <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
              <Text style={styles.rescanText}>Tap to scan again</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20 },
  backBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scanFrame: { width: 250, height: 250, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#22C55E', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  hint: { textAlign: 'center', color: '#fff', fontSize: 14, marginBottom: 40 },
  rescanBtn: { alignSelf: 'center', backgroundColor: '#22C55E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 40 },
  rescanText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionText: { fontSize: 16, color: '#8E8E93', marginTop: 16 },
  permissionBtn: { marginTop: 20, backgroundColor: '#22C55E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

