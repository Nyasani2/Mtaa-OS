import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { PinPad } from '@/components/auth/PinPad';
import { biometricEngine } from '@/lib/security/biometric-engine';

const { width } = Dimensions.get('window');

interface PaymentAuthProps {
  amount: number;
  currency: string;
  recipientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentAuth({
  amount,
  currency,
  recipientName,
  onSuccess,
  onCancel,
}: PaymentAuthProps) {
  const [mode, setMode] = useState<'biometric' | 'pin' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    attemptBiometric();
  }, []);

  const attemptBiometric = async () => {
    setIsLoading(true);
    setError('');

    if (!biometricEnabled || !user) {
      setMode('pin');
      setIsLoading(false);
      return;
    }

    try {
      const hasHardware = await biometricEngine.hasHardwareAsync();
      const isEnrolled = await biometricEngine.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setMode('pin');
        setIsLoading(false);
        return;
      }

      const result = await biometricEngine.authenticateBiometric({
        promptMessage: `Authorize ${currency} ${amount.toFixed(2)} to ${recipientName}`,
        cancelLabel: 'Use PIN',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        onSuccess();
        return;
      }

      setMode('pin');
    } catch (err) {
      setMode('pin');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setError('');
    const valid = await useAuthStore.getState().verifyPin(pin);
    if (valid) {
      onSuccess();
    } else {
      setError('Incorrect PIN. Payment cancelled.');
    }
  };

  if (isLoading && mode === null) {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Authenticating payment...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>You are sending</Text>
          <Text style={styles.amountValue}>
            {currency} {amount.toFixed(2)}
          </Text>
          <Text style={styles.recipientLabel}>To {recipientName}</Text>
        </View>

        <Text style={styles.title}>Authorize Payment</Text>
        <Text style={styles.subtitle}>
          {mode === 'biometric'
            ? 'Use biometric authentication'
            : 'Enter your PIN to authorize this transaction'}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {mode === 'pin' && (
          <PinPad
            maxLength={6}
            onSubmit={handlePinSubmit}
            showForgot={false}
          />
        )}

        {biometricEnabled && mode === 'pin' && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={attemptBiometric}
          >
            <Text style={styles.biometricText}>🔓 Use Biometric</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10001,
    elevation: 10001,
    backgroundColor: 'rgba(10,10,15,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    alignItems: 'center',
    paddingVertical: 32,
  },
  amountCard: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
    width: '100%',
  },
  amountLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  recipientLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  biometricButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  biometricText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
});
