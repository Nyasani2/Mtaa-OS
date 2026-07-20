import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { setPin } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const MAX_LENGTH = 6;
const MIN_LENGTH = 6;

export default function SetPinScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [createPin, setCreatePin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const currentPin = step === 'create' ? createPin : confirmPin;
  const currentSetter = step === 'create' ? setCreatePin : setConfirmPin;

  const handleDigit = useCallback((digit: string) => {
    setError('');
    if (currentPin.length < MAX_LENGTH) {
      currentSetter((prev) => prev + digit);
    }
  }, [currentPin, currentSetter]);

  const handleBackspace = useCallback(() => {
    setError('');
    currentSetter((prev) => prev.slice(0, -1));
  }, [currentSetter]);

  const handleNext = useCallback(() => {
    if (createPin.length < MIN_LENGTH) {
      setError(`PIN must be at least ${MIN_LENGTH} digits`);
      Vibration.vibrate(200);
      return;
    }
    setStep('confirm');
    setError('');
  }, [createPin]);

  const handleConfirm = useCallback(async () => {
    if (confirmPin !== createPin) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      Vibration.vibrate(200);
      return;
    }
    try {
      await setPin(confirmPin);
      // Go to OS home
      router.replace('/(os)');
    } catch (e: any) {
      setError(e.message || 'Failed to save PIN');
    }
  }, [confirmPin, createPin, router]);

  const handleSkip = useCallback(() => {
    // User can skip PIN setup for now
    router.replace('/(os)');
  }, [router]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  const canProceed = step === 'create'
    ? createPin.length >= MIN_LENGTH
    : confirmPin.length === createPin.length;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#f8f9fa' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a2e' }]}>
        {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        {step === 'create'
          ? `Enter ${MIN_LENGTH}-${MAX_LENGTH} digits for security`
          : 'Re-enter your PIN to confirm'}
      </Text>

      {/* PIN Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: MAX_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < currentPin.length
                  ? '#6366f1'
                  : isDark ? '#374151' : '#e5e7eb',
                opacity: i >= MIN_LENGTH && i >= currentPin.length ? 0.3 : 1,
              },
            ]}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {digits.map((digit, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.key, digit === '' && { opacity: 0 }]}
            onPress={() => {
              if (digit === 'back') handleBackspace();
              else if (digit !== '') handleDigit(digit);
            }}
            disabled={digit === ''}
          >
            <Text style={[styles.keyText, { color: isDark ? '#fff' : '#1a1a2e' }]}>
              {digit === 'back' ? '⌫' : digit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.button, { opacity: canProceed ? 1 : 0.4 }]}
        onPress={step === 'create' ? handleNext : handleConfirm}
        disabled={!canProceed}
      >
        <Text style={styles.buttonText}>
          {step === 'create' ? 'Next' : 'Set PIN'}
        </Text>
      </TouchableOpacity>

      {/* Skip button (only on create step) */}
      {step === 'create' && (
        <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipLink: {
    marginTop: 16,
  },
});
