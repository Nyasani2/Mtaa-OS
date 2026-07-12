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

const PIN_LENGTH = 6; // Default 6-digit, configurable

export default function SetPinScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';

  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
  const [error, setError] = useState('');

  const handleDigit = useCallback((digit: string) => {
    setError('');
    if (step === 'create') {
      if (pin.length < PIN_LENGTH) {
        setPinValue((prev) => prev + digit);
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < PIN_LENGTH) {
        setConfirmPin((prev) => prev + digit);
      }
    }
  }, [pin, confirmPin, step]);

  const handleBackspace = useCallback(() => {
    setError('');
    if (step === 'create') {
      setPinValue((prev) => prev.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  }, [step]);

  const handleCreateNext = useCallback(() => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      Vibration.vibrate(200);
      return;
    }
    setStep('confirm');
  }, [pin]);

  const handleConfirm = useCallback(async () => {
    if (confirmPin !== pin) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      Vibration.vibrate(200);
      return;
    }
    try {
      await setPin(confirmPin);
      setStep('success');
      setTimeout(() => {
        router.replace('/(os)');
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to set PIN');
    }
  }, [confirmPin, pin, router]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  const currentPin = step === 'create' ? pin : confirmPin;
  const isComplete = currentPin.length >= (step === 'create' ? 4 : pin.length);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#f8f9fa' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a2e' }]}>
        {step === 'create' ? 'Create PIN' : step === 'confirm' ? 'Confirm PIN' : 'PIN Set!'}
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        {step === 'create'
          ? `Enter a ${PIN_LENGTH}-digit PIN (min 4)`
          : step === 'confirm'
          ? 'Re-enter your PIN to confirm'
          : 'Your PIN has been set successfully'}
      </Text>

      {/* PIN Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < currentPin.length
                  ? '#6366f1'
                  : isDark ? '#374151' : '#e5e7eb',
              },
            ]}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {step === 'success' ? null : (
        <>
          {/* Keypad */}
          <View style={styles.keypad}>
            {digits.map((digit, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.key,
                  digit === '' && { opacity: 0 },
                ]}
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

          {/* Next/Confirm Button */}
          <TouchableOpacity
            style={[styles.button, { opacity: isComplete ? 1 : 0.5 }]}
            onPress={step === 'create' ? handleCreateNext : handleConfirm}
            disabled={!isComplete}
          >
            <Text style={styles.buttonText}>
              {step === 'create' ? 'Next' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </>
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
});
