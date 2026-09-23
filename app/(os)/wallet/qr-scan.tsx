// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function QRScanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraKey, setCameraKey] = useState(0); // Force re-render

  // Parse QR Code data
  const parseQRCode = (data: string) => {
    try {
      // Check if it's an MTAA payment QR
      if (data.startsWith('mtaa://pay?')) {
        const url = new URL(data);
        const params = {
          nonce: url.searchParams.get('nonce'),
          uid: url.searchParams.get('uid'),
          exp: url.searchParams.get('exp'),
          local: url.searchParams.get('local'),
        };
        
        console.log('[QR Scanner] Parsed MTAA payment:', params);
        return { type: 'mtaa_pay', ...params };
      }
      
      // Check if it's a plain user ID
      if (data.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return { type: 'mtaa_pay', uid: data, local: 'true' };
      }
      
      return { type: 'unknown', raw: data };
    } catch (e) {
      console.error('[QR Scanner] Parse error:', e);
      return { type: 'error', raw: data };
    }
  };

  // Handle barcode/QR scan
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    console.log('[QR Scanner] Scanned:', { type, data });
    setScanned(true);
    
    const parsed = parseQRCode(data);
    
    if (parsed.type === 'mtaa_pay') {
      setScannedData(parsed);
      setShowPaymentModal(true);
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This is not a valid MTAA payment QR code.',
        [{ text: 'OK', onPress: () => { setScanned(false); setCameraKey(k => k + 1); } }]
      );
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in to make payments.');
      return;
    }

    setProcessing(true);
    
    try {
      // If it's a local QR (no nonce), use simple transfer
      if (scannedData.local || !scannedData.nonce) {
        // Call wallet transfer endpoint
        const { error } = await supabase.functions.invoke('wallet-transfer', {
          body: {
            sender_id: user.id,
            receiver_id: scannedData.uid,
            amount: parseFloat(amount),
            currency: 'KES',
            description: 'QR Payment'
          }
        });
        
        if (error) throw error;
      } else {
        // Use secure QR execute endpoint
        const { error } = await supabase.functions.invoke('qr-execute', {
          body: {
            nonce: scannedData.nonce,
            scanner_user_id: user.id,
            amount: parseFloat(amount),
            payee_id: scannedData.uid
          }
        });
        
        if (error) throw error;
      }
      
      // Success!
      Alert.alert(
        'Payment Successful! ✅',
        `You have paid KES ${parseFloat(amount).toFixed(2)}`,
        [{
          text: 'OK',
          onPress: () => {
            setShowPaymentModal(false);
            setScanned(false);
            setAmount('');
            setCameraKey(k => k + 1);
          }
        }]
      );
    } catch (err: any) {
      console.error('[QR Payment] Error:', err);
      Alert.alert('Payment Failed', err.message || 'An error occurred while processing payment.');
    } finally {
      setProcessing(false);
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setScanned(false);
    setScannedData(null);
    setShowPaymentModal(false);
    setAmount('');
    setCameraKey(k => k + 1);
  };

  // Render camera permission request
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={120} color="#64748b" />
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.subtitle}>
          We need access to your camera to scan QR codes for payments.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <TouchableOpacity 
          onPress={() => setTorch(!torch)} 
          style={styles.headerButton}
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          key={cameraKey}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417', 'aztec'],
          }}
          enableTorch={torch}
        />
        
        {/* Scan Frame Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
        
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Position the QR code within the frame
          </Text>
        </View>
      </View>

      {/* Manual Entry Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.manualButton} onPress={() => {
          Alert.alert('Manual Entry', 'Enter recipient ID or payment code manually.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK', onPress: () => console.log('Manual entry TODO') }
          ]);
        }}>
          <Ionicons name="keypad" size={20} color="#8b5cf6" />
          <Text style={styles.manualButtonText}>Enter Code Manually</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Amount</Text>
            <Text style={styles.modalSubtitle}>
              Recipient: {scannedData?.uid?.substring(0, 8)}...
            </Text>
            
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>KES</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetScanner}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.payButton, (!amount || processing) && styles.payButtonDisabled]}
                onPress={processPayment}
                disabled={!amount || processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderRadius: 20,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#8b5cf6',
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopLeftRadius: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopRightRadius: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomLeftRadius: 10,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomRightRadius: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#0f172a',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  manualButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#8b5cf6',
  },
  payButtonDisabled: {
    backgroundColor: '#475569',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 16,
  },
});
