// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface WalletPinGuardProps { isOpen: boolean; onClose: () => void; onVerified: () => void; amount: number; recipientName: string; }

export default function WalletPinGuard({ isOpen, onClose, onVerified, amount, recipientName }: WalletPinGuardProps) {
  const { user, profile } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) { setPin(''); setError(null); if (profile?.biometric_enabled) triggerBiometric(); } }, [isOpen]);

  const triggerBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (hasHardware) {
        const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm KES ' + amount + ' to ' + recipientName, fallbackLabel: 'Use PIN' });
        if (result.success) { onVerified(); onClose(); }
      }
    } catch (err) { console.error('Biometric error:', err); }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) { setError('PIN must be 4 digits'); return; }
    setLoading(true); setError(null);
    try {
      const { pinEngine } = await import('@/lib/security/pin-engine');
      const isValid = await pinEngine.verifyPin(user?.id || '', pin);
      if (isValid) { onVerified(); onClose(); } else { setError('Incorrect PIN'); setPin(''); }
    } catch (err: any) { setError(err.message || 'Failed'); setPin(''); } finally { setLoading(false); }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Ionicons name="shield-checkmark" size={40} color="#10b981" />
          <Text style={styles.title}>Confirm Transaction</Text>
          <Text style={styles.subtitle}>Sending <Text style={styles.amount}>KES {amount.toLocaleString()}</Text> to {recipientName}</Text>
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          <TextInput style={styles.pinInput} placeholder="••••" keyboardType="number-pad" maxLength={4} value={pin} onChangeText={setPin} secureTextEntry />
          <TouchableOpacity style={styles.verifyBtn} onPress={handlePinSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Verify & Send</Text>}
          </TouchableOpacity>
          {profile?.biometric_enabled && <TouchableOpacity style={styles.bioBtn} onPress={triggerBiometric}><Text style={styles.bioText}>Use Biometric Instead</Text></TouchableOpacity>}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 380, backgroundColor: '#1e293b', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  amount: { color: '#10b981', fontWeight: '700' },
  errorBox: { backgroundColor: '#ef444420', borderRadius: 8, padding: 10, marginBottom: 16, width: '100%' },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  pinInput: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 28, fontWeight: '600', textAlign: 'center', letterSpacing: 12, width: 160, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  verifyBtn: { backgroundColor: '#10b981', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bioBtn: { padding: 12, width: '100%', alignItems: 'center' },
  bioText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  cancelBtn: { marginTop: 8, padding: 12 },
  cancelText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
});
