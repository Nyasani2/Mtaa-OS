import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { pinEngine } from '@/lib/security/pin-engine';
import { PinPad as PinPadRaw } from '@/components/auth/PinPad';

const PinPad = PinPadRaw as any;

export default function PinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'check' | 'create' | 'confirm'>('check');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const user = useAuthStore((s: any) => s.user);
  const userId = user?.id || '';
  const [pinExists, setPinExists] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    pinEngine.hasPin(userId).then(setPinExists);
  }, []);

  const handleVerifyCurrent = async () => {
    setError('');
    if (currentPin.length < 4) {
      setError('Enter your current PIN');
      return;
    }
    try {
      const valid = await pinEngine.verifyPin(userId, currentPin);
      if (valid) {
        setStep('create');
        setCurrentPin('');
      } else {
        setError('Incorrect PIN');
        setCurrentPin('');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
      setCurrentPin('');
    }
  };

  const handleCreateSubmit = () => {
    setError('');
    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmSubmit = async () => {
    setError('');
    if (newPin !== confirmPin) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      return;
    }
    try {
      await pinEngine.setPin(userId, confirmPin);
      Alert.alert('Success', pinExists ? 'PIN updated' : 'PIN created', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      setError(err?.message || 'Failed to save PIN');
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove PIN', 'Disable PIN protection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await pinEngine.clearPin(userId);
          Alert.alert('Removed', 'PIN protection disabled');
          router.back();
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'Failed');
        }
      }}
    ]);
  };

  if (pinExists === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="lock-closed" size={48} color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'check' && pinExists ? 'Change PIN' : 
           step === 'check' && !pinExists ? 'Create PIN' :
           step === 'create' ? 'New PIN' : 'Confirm PIN'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'check' && pinExists ? (
        <>
          <PinPad
            value={currentPin}
            onPressDigit={(d: string) => setCurrentPin(p => p + d)}
            onBackspace={() => setCurrentPin(p => p.slice(0, -1))}
            onSubmit={handleVerifyCurrent}
            label="Enter current PIN"
          />
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
            <Text style={styles.removeText}>Remove PIN</Text>
          </TouchableOpacity>
        </>
      ) : step === 'create' || (step === 'check' && !pinExists) ? (
        <PinPad
          value={newPin}
          onPressDigit={(d: string) => setNewPin(p => p + d)}
          onBackspace={() => setNewPin(p => p.slice(0, -1))}
          onSubmit={handleCreateSubmit}
          label={pinExists ? 'Enter new PIN' : 'Create your PIN'}
        />
      ) : (
        <PinPad
          value={confirmPin}
          onPressDigit={(d: string) => setConfirmPin(p => p + d)}
          onBackspace={() => setConfirmPin(p => p.slice(0, -1))}
          onSubmit={handleConfirmSubmit}
          label="Confirm your PIN"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, position: 'absolute', top: 0, left: 0, right: 0 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  error: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 80, marginBottom: 8 },
  removeBtn: { alignItems: 'center', marginTop: 24 },
  removeText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
});
