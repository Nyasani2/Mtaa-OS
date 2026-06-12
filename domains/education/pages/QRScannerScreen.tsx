import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQRSession } from '@/domains/education/hooks/useQRSession';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

// Note: This uses expo-camera for QR scanning
// Install: npx expo install expo-camera
// import { CameraView, useCameraPermissions } from 'expo-camera';

const SCAN_RESULTS = {
  success: { color: '#10B981', icon: 'checkmark-circle', title: 'Valid QR Code', message: 'Scan successful' },
  expired: { color: '#F59E0B', icon: 'time', title: 'Expired', message: 'This QR code has expired' },
  revoked: { color: '#EF4444', icon: 'close-circle', title: 'Revoked', message: 'This QR code has been revoked' },
  invalid: { color: '#EF4444', icon: 'alert-circle', title: 'Invalid', message: 'This QR code is not recognized' },
  already_scanned: { color: '#F59E0B', icon: 'refresh-circle', title: 'Already Used', message: 'This QR code has already been scanned' },
  wrong_institution: { color: '#EF4444', icon: 'business', title: 'Wrong Institution', message: 'QR code belongs to a different institution' },
};

export default function QRScannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { scanQR, scanning } = useQRSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<{ valid: boolean; reason: string; session?: any } | null>(null);
  const [manualEntry, setManualEntry] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [scanned, setScanned] = useState(false);

  // ─── CAMERA PERMISSION ───
  useEffect(() => {
    // In real implementation:
    // const [permission, requestPermission] = useCameraPermissions();
    // requestPermission();
    setHasPermission(true); // Stub for now
  }, []);

  // ─── HANDLE BARCODE SCANNED ───
  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scanned || scanning) return;
    setScanned(true);
    Vibration.vibrate(200);

    try {
      // Parse QR data to extract session ID
      let sessionId: string;
      try {
        const parsed = JSON.parse(data);
        sessionId = parsed.session_id || parsed.id || data;
      } catch {
        // If not JSON, use raw data as session ID
        sessionId = data;
      }

      const result = await scanQR(sessionId);
      setScanResult(result);

      if (result.valid) {
        Vibration.vibrate([0, 100, 50, 100]);
      } else {
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (err: any) {
      setScanResult({ valid: false, reason: 'invalid' });
      Alert.alert('Scan Error', err.message || 'Failed to process QR code');
    }
  }, [scanned, scanning, scanQR]);

  // ─── HANDLE MANUAL ENTRY ───
  const handleManualScan = useCallback(async () => {
    if (!manualEntry.trim()) {
      Alert.alert('Error', 'Please enter a session ID');
      return;
    }
    setScanned(true);
    try {
      const result = await scanQR(manualEntry.trim());
      setScanResult(result);
    } catch (err: any) {
      setScanResult({ valid: false, reason: 'invalid' });
      Alert.alert('Error', err.message || 'Failed to process');
    }
  }, [manualEntry, scanQR]);

  // ─── RESET SCAN ───
  const handleReset = useCallback(() => {
    setScanned(false);
    setScanResult(null);
    setManualEntry('');
  }, []);

  // ─── LOADING PERMISSION ───
  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // ─── NO PERMISSION ───
  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Camera Access Denied</Text>
        <Text style={styles.errorText}>Please enable camera access in settings to scan QR codes.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setShowManual(true)}>
          <Text style={styles.retryButtonText}>Use Manual Entry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── SCAN RESULT OVERLAY ───
  if (scanResult) {
    const resultConfig = SCAN_RESULTS[scanResult.reason as keyof typeof SCAN_RESULTS] || SCAN_RESULTS.invalid;

    return (
      <View style={[styles.container, { backgroundColor: resultConfig.color + '15' }]}>
        <View style={styles.resultContainer}>
          <View style={[styles.resultIconCircle, { backgroundColor: resultConfig.color + '20' }]}>
            <Ionicons name={resultConfig.icon as any} size={64} color={resultConfig.color} />
          </View>

          <Text style={[styles.resultTitle, { color: resultConfig.color }]}>
            {resultConfig.title}
          </Text>
          <Text style={styles.resultMessage}>{resultConfig.message}</Text>

          {scanResult.session && (
            <View style={styles.sessionDetails}>
              <Text style={styles.sessionDetailLabel}>QR Type</Text>
              <Text style={styles.sessionDetailValue}>{scanResult.session.qr_type || 'Unknown'}</Text>

              <Text style={styles.sessionDetailLabel}>Generated By</Text>
              <Text style={styles.sessionDetailValue}>{scanResult.session.generated_by_role || 'Unknown'}</Text>

              {scanResult.session.target_id && (
                <>
                  <Text style={styles.sessionDetailLabel}>Target ID</Text>
                  <Text style={styles.sessionDetailValue}>{scanResult.session.target_id}</Text>
                </>
              )}

              <Text style={styles.sessionDetailLabel}>Scan Count</Text>
              <Text style={styles.sessionDetailValue}>
                {scanResult.session.scan_count || 0} / {scanResult.session.max_scans || '∞'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: resultConfig.color }]} onPress={handleReset}>
            <Ionicons name="scan" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Scan Another</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── MAIN SCANNER VIEW ───
  return (
    <View style={styles.container}>
      {/* Camera View Stub - Replace with actual CameraView */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraStub}>
          <Ionicons name="camera" size={48} color="#9CA3AF" />
          <Text style={styles.cameraStubText}>Camera Preview</Text>
          <Text style={styles.cameraStubSubtext}>Point camera at QR code</Text>

          {/* Simulated scan button for testing */}
          <TouchableOpacity
            style={styles.simulateButton}
            onPress={() => handleBarCodeScanned({ data: 'test-session-id-123' })}
          >
            <Text style={styles.simulateButtonText}>Simulate Scan (Test)</Text>
          </TouchableOpacity>
        </View>

        {/* Scan overlay */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.scanCorner, styles.scanCornerTL]} />
            <View style={[styles.scanCorner, styles.scanCornerTR]} />
            <View style={[styles.scanCorner, styles.scanCornerBL]} />
            <View style={[styles.scanCorner, styles.scanCornerBR]} />
          </View>
          <Text style={styles.scanHint}>Align QR code within frame</Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setShowManual(!showManual)}>
          <Ionicons name="keypad-outline" size={24} color="#2563EB" />
          <Text style={styles.controlButtonText}>Manual Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
          <Ionicons name="close-outline" size={24} color="#6B7280" />
          <Text style={styles.controlButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Manual entry modal */}
      {showManual && (
        <View style={styles.manualOverlay}>
          <View style={styles.manualContent}>
            <Text style={styles.manualTitle}>Manual Entry</Text>
            <Text style={styles.manualSubtitle}>Enter the session ID manually</Text>
            <TextInput
              style={styles.manualInput}
              value={manualEntry}
              onChangeText={setManualEntry}
              placeholder="Enter session ID..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.manualActions}>
              <TouchableOpacity style={styles.manualCancel} onPress={() => setShowManual(false)}>
                <Text style={styles.manualCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.manualConfirm} onPress={handleManualScan} disabled={scanning}>
                {scanning ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.manualConfirmText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  errorText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
  retryButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563EB', borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  cameraContainer: { flex: 1, position: 'relative' },
  cameraStub: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937' },
  cameraStubText: { fontSize: 18, color: '#9CA3AF', marginTop: 12 },
  cameraStubSubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  simulateButton: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#374151', borderRadius: 8 },
  simulateButtonText: { color: '#9CA3AF', fontSize: 12 },

  scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, position: 'relative' },
  scanCorner: { position: 'absolute', width: 30, height: 30, borderColor: '#10B981', borderWidth: 4 },
  scanCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  scanCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  scanCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  scanCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { marginTop: 20, fontSize: 14, color: '#FFF', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },

  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, backgroundColor: '#1F2937' },
  controlButton: { alignItems: 'center', gap: 4 },
  controlButtonText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  resultIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  resultTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  resultMessage: { fontSize: 16, color: '#6B7280', marginBottom: 24, textAlign: 'center' },

  sessionDetails: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 24 },
  sessionDetailLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 8 },
  sessionDetailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 2 },

  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginBottom: 12 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backButton: { paddingVertical: 12 },
  backButtonText: { color: '#6B7280', fontSize: 14 },

  manualOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 100 },
  manualContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  manualTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  manualSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  manualInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: '#1F2937' },
  manualActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  manualCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8 },
  manualCancelText: { color: '#6B7280', fontWeight: '600' },
  manualConfirm: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 8 },
  manualConfirmText: { color: '#FFF', fontWeight: '600' },
});
