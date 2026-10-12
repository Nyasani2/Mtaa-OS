// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChildSafetyScanScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [foundChild, setFoundChild] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (!scanning || loading) return;
    
    // Only process MTAA Safety QR codes
    if (!data.startsWith('MTAA-SAFE-')) {
      Alert.alert('Invalid Code', 'This is not a valid MTAA Child Safety QR code.');
      return;
    }

    setScanning(false);
    setLoading(true);

    try {
      // 1. Check if child is registered in education_students
      const { data: student, error } = await supabase
        .from('education_students')
        .select('full_name, institution_id, parent_guardian_phone, safety_qr_code')
        .eq('safety_qr_code', data)
        .single();

      if (student && !error) {
        setFoundChild(student);
      } else {
        // 2. Not found in registered students. Prompt to report as found.
        Alert.alert(
          'Child Not Registered',
          'This child is not in the MTAA database. Would you like to report them as "Found" so their parents can locate them?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setScanning(true) },
            { text: 'Report Found Child', onPress: () => router.push(`/(os)/child-safety/report-found?scan_data=${encodeURIComponent(data)}`) }
          ]
        );
      }
    } catch (err) {
      console.error('Safety scan error:', err);
      Alert.alert('Error', 'Failed to lookup child information.');
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCallParent = () => {
    if (foundChild?.parent_guardian_phone) {
      Linking.openURL(`tel:${foundChild.parent_guardian_phone}`);
    } else {
      Alert.alert('No Phone', 'Parent phone number is not registered.');
    }
  };

  const resetScanner = () => {
    setFoundChild(null);
    setScanning(true);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-off" size={64} color="#94a3b8" />
        <Text style={styles.text}>Camera access is required to scan safety codes.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Child Safety Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      {foundChild ? (
        <View style={styles.foundContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="shield-checkmark" size={64} color="#10B981" />
          </View>
          <Text style={styles.foundTitle}>Child Located!</Text>
          <Text style={styles.foundName}>{foundChild.full_name}</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="school" size={20} color="#94a3b8" />
              <Text style={styles.infoText}>Registered at a MTAA School</Text>
            </View>
            {foundChild.parent_guardian_phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#94a3b8" />
                <Text style={styles.infoText}>{foundChild.parent_guardian_phone}</Text>
              </View>
            )}
          </View>

          <Text style={styles.instruction}>
            Please stay with the child and contact their parent/guardian immediately.
          </Text>

          <TouchableOpacity style={styles.callButton} onPress={handleCallParent}>
            <Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.callButtonText}>Call Parent / Guardian</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanAgainButton} onPress={resetScanner}>
            <Text style={styles.scanAgainText}>Scan Another Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scannerContainer}>
          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Looking up child...</Text>
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanInstruction}>
                  Align the child's Safety QR Code within the frame
                </Text>
              </View>
            </CameraView>
          )}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This feature helps reunite lost children with their guardians. 
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0f172a' },
  text: { color: '#94a3b8', marginTop: 16, textAlign: 'center', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scannerContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: { width: 250, height: 250, borderRadius: 16, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: 'transparent' },
  scanInstruction: { color: '#fff', marginTop: 24, fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  footer: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  footerText: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  foundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10B98120', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  foundTitle: { color: '#10B981', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  foundName: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 24 },
  infoCard: { width: '100%', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { color: '#e2e8f0', fontSize: 16, marginLeft: 12 },
  instruction: { color: '#fbbf24', fontSize: 14, textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 },
  callButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, width: '100%', marginBottom: 16 },
  callButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scanAgainButton: { paddingVertical: 12 },
  scanAgainText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  button: { marginTop: 24, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
