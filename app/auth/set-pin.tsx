import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { setPin } from '@/lib/security/pin-engine';
import { useOSShell } from '@/lib/shell/use-os-shell';

export default function SetPinScreen() {
  const router = useRouter();
  const { unlock, refreshPinState } = useOSShell();

  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const validatePin = useCallback((value: string) => {
    if (value.length < 4) return 'PIN must be at least 4 digits';
    if (value.length > 6) return 'PIN must be at most 6 digits';
    if (!/^\d+$/.test(value)) return 'PIN must contain only numbers';
    return '';
  }, []);

  const handleContinue = useCallback(async () => {
    const validationError = validatePin(pin);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep('confirm');
  }, [pin, validatePin]);

  const handleConfirm = useCallback(async () => {
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await setPin(pin);
      if (result.success) {
        await refreshPinState();
        unlock();
        router.replace('/(os)');
      } else {
        setError(result.error || 'Failed to set PIN');
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [pin, confirmPin, router, unlock, refreshPinState]);

  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
      setError('');
    } else {
      router.back();
    }
  }, [step, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>
          {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create'
            ? 'Set a 4-6 digit PIN to secure your device'
            : 'Re-enter your PIN to confirm'}
        </Text>

        <View style={styles.pinContainer}>
          {(step === 'create' ? pin : confirmPin).split('').map((_, i) => (
            <View key={i} style={styles.pinDot}>
              <View style={styles.pinDotInner} />
            </View>
          ))}
          {Array.from({ length: 6 - (step === 'create' ? pin : confirmPin).length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.pinDotEmpty} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.hiddenInput}
          value={step === 'create' ? pin : confirmPin}
          onChangeText={step === 'create' ? setPinValue : setConfirmPin}
          keyboardType="number-pad"
          secureTextEntry={!showPin}
          maxLength={6}
          autoFocus
          caretHidden
        />

        <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.showToggle}>
          <Ionicons name={showPin ? 'eye-off' : 'eye'} size={20} color="#6366F1" />
          <Text style={styles.showToggleText}>{showPin ? 'Hide PIN' : 'Show PIN'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={step === 'create' ? handleContinue : handleConfirm}
          disabled={loading || (step === 'create' ? pin : confirmPin).length < 4}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 'create' ? 'Continue' : 'Set PIN'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backButton: { position: 'absolute', top: 16, left: 16, zIndex: 1, padding: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, marginBottom: 40 },
  pinContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  pinDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  pinDotEmpty: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#333' },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 16, fontSize: 14 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  showToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  showToggleText: { color: '#6366F1', fontSize: 14 },
  button: { backgroundColor: '#6366F1', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: '#999', fontSize: 14 },
});
