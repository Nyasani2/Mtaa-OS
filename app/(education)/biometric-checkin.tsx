import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';

export default function BiometricCheckin() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [checkpoint, setCheckpoint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    loadCheckpoint();
    checkBiometricAvailability();
  }, [id]);

  const loadCheckpoint = async () => {
    if (!id) return;
    const { data } = await supabase.from('education_biometric_checkpoints').select('*').eq('id', id).single();
    setCheckpoint(data);
    setLoading(false);
  };

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometric(compatible && enrolled);
  };

  const performScan = async () => {
    if (!user?.id || !checkpoint) return;
    setScanning(true);

    if (hasBiometric) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Scan fingerprint for ${checkpoint.name}`,
        fallbackLabel: 'Use QR Code instead',
      });
      if (!result.success) {
        Alert.alert('Scan Failed', 'Biometric scan was not successful. Try again or use QR.');
        setScanning(false);
        return;
      }
    }

    try {
      await supabase.from('education_biometric_scans').insert({
        checkpoint_id: checkpoint.id,
        user_id: user.id,
        scan_type: hasBiometric ? 'fingerprint' : 'qr',
        scan_time: new Date().toISOString(),
        verified: true,
        location: checkpoint.location
      });
      
      await supabase.from('education_biometric_checkpoints').update({
        last_scan: new Date().toISOString(),
        scans_today: (checkpoint.scans_today || 0) + 1
      }).eq('id', checkpoint.id);

      Alert.alert('✅ Success', `Checked in at ${checkpoint.name}`);
      loadCheckpoint();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record scan');
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  if (!checkpoint) return <View style={styles.center}><Text style={styles.errorText}>Checkpoint not found</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{checkpoint.name}</Text>
          <Text style={styles.headerSub}>{checkpoint.location}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.scanArea}>
          <View style={styles.scanCircle}>
            <Ionicons name={hasBiometric ? 'finger-print' : 'qr-code'} size={64} color={scanning ? '#3b82f6' : '#64748b'} />
          </View>
          <Text style={styles.scanText}>{scanning ? 'Scanning...' : `Tap to scan at ${checkpoint.name}`}</Text>
          <Text style={styles.scanSubtext}>{checkpoint.scans_today || 0} scans recorded today</Text>
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={performScan} disabled={scanning}>
          {scanning ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name={hasBiometric ? 'finger-print' : 'qr-code'} size={24} color="#fff" />
              <Text style={styles.scanBtnText}>{hasBiometric ? 'Scan Fingerprint' : 'Scan QR Code'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Checkpoint Info</Text>
          <View style={styles.infoRow}>
            <Ionicons name="hardware-chip" size={18} color="#94a3b8" />
            <Text style={styles.infoText}>Device Type: {checkpoint.device_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color="#94a3b8" />
            <Text style={styles.infoText}>Last Scan: {checkpoint.last_scan ? new Date(checkpoint.last_scan).toLocaleTimeString() : 'Never'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  errorText: { color: '#ef4444', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  scanArea: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  scanCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155', marginBottom: 20 },
  scanText: { fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center' },
  scanSubtext: { fontSize: 14, color: '#64748b', marginTop: 8 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#3b82f6', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%' },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoCard: { width: '100%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginTop: 24 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#cbd5e1' },
});
