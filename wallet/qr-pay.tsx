// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useWallet } from '@/hooks/useWallet';
import { colors } from '@/constants/theme';
const colors = (colors as any)?.light || colors || {};
const fonts = { regular: 'System', bold: 'System', light: 'System' };
const sizes = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 };

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.65;

export default function QRPayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance, sendMoney } = useWallet();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'scan' | 'mycode'>('scan');

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const parsed = JSON.parse(data);
      setScanData(parsed);
    } catch {
      // Treat raw string as wallet ID
      setScanData({ walletId: data, amount: 0 });
    }
  }, [scanned]);

  const handlePay = useCallback(async () => {
    if (!scanData) return;
    setLoading(true);
    try {
      await sendMoney?.({
        recipient: scanData.walletId || scanData.recipient,
        amount: scanData.amount || 0,
        note: scanData.note || 'QR Payment',
      });
      Alert.alert('Success', 'Payment completed', [
        { text: 'OK', onPress: () => { setScanned(false); setScanData(null); } }
      ]);
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.message || 'Something went wrong');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  }, [scanData, sendMoney]);

  if (!permission?.granted) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>We need camera permission to scan QR codes</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'scan' && styles.modeBtnActive]}
          onPress={() => { setMode('scan'); setScanned(false); setScanData(null); }}
        >
          <Ionicons name="scan-outline" size={16} color={mode === 'scan' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.modeText, mode === 'scan' && styles.modeTextActive]}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'mycode' && styles.modeBtnActive]}
          onPress={() => setMode('mycode')}
        >
          <Ionicons name="qr-code-outline" size={16} color={mode === 'mycode' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.modeText, mode === 'mycode' && styles.modeTextActive]}>My Code</Text>
        </TouchableOpacity>
      </View>

      {mode === 'scan' ? (
        <View style={styles.scanContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />

          {/* Overlay */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.overlayDark} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlayDark} />
          </View>

          {/* Scan prompt */}
          <View style={styles.scanPrompt} pointerEvents="none">
            <Text style={styles.scanPromptText}>Align QR code within frame</Text>
          </View>

          {/* Scanned result */}
          {scanned && scanData && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Payment Request</Text>
              <Text style={styles.resultDetail}>To: {scanData.walletId || scanData.recipient || 'Unknown'}</Text>
              {scanData.amount > 0 && (
                <Text style={styles.resultAmount}>KSh {Number(scanData.amount).toLocaleString()}</Text>
              )}
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultCancel} onPress={() => { setScanned(false); setScanData(null); }}>
                  <Text style={styles.resultCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resultPay, loading && { opacity: 0.6 }]}
                  onPress={handlePay}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.resultPayText}>Pay</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.codeContainer}>
          <View style={styles.codeCard}>
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={120} color={colors.primary} />
            </View>
            <Text style={styles.codeLabel}>Your QR Code</Text>
            <Text style={styles.codeSub}>Others can scan this to pay you</Text>
          </View>
          <View style={styles.balanceMini}>
            <Text style={styles.balanceMiniLabel}>Balance</Text>
            <Text style={styles.balanceMiniValue}>KSh {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#fff' },
  modeBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: sizes.md,
    padding: 4,
    marginBottom: sizes.md,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.sm,
    borderRadius: sizes.sm,
    gap: 6,
  },
  modeBtnActive: { backgroundColor: colors.primary },
  modeText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  modeTextActive: { color: '#fff' },
  scanContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  overlayDark: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanPrompt: { position: 'absolute', bottom: 120 },
  scanPromptText: { fontFamily: fonts.medium, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  resultCard: {
    position: 'absolute',
    bottom: 40,
    left: sizes.md,
    right: sizes.md,
    backgroundColor: colors.surface,
    borderRadius: sizes.md,
    padding: sizes.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  resultTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: sizes.sm },
  resultDetail: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  resultAmount: { fontFamily: fonts.bold, fontSize: 24, color: colors.primary, marginTop: sizes.sm },
  resultActions: { flexDirection: 'row', gap: sizes.md, marginTop: sizes.lg },
  resultCancel: {
    flex: 1,
    paddingVertical: sizes.md,
    borderRadius: sizes.sm,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  resultCancelText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  resultPay: {
    flex: 1,
    paddingVertical: sizes.md,
    borderRadius: sizes.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  resultPayText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  codeContainer: { flex: 1, alignItems: 'center', paddingTop: sizes.xl },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.lg,
    padding: sizes.xl,
    alignItems: 'center',
    width: width - sizes.md * 2,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: sizes.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizes.md,
  },
  codeLabel: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  codeSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  balanceMini: {
    marginTop: sizes.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: sizes.md,
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.md,
    alignItems: 'center',
  },
  balanceMiniLabel: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  balanceMiniValue: { fontFamily: fonts.bold, fontSize: 20, color: '#fff', marginTop: 2 },
  permTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginTop: sizes.lg },
  permSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: sizes.sm, textAlign: 'center', paddingHorizontal: sizes.xl },
  permBtn: {
    marginTop: sizes.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: sizes.xl,
    paddingVertical: sizes.md,
    borderRadius: sizes.md,
  },
  permBtnText: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
});

