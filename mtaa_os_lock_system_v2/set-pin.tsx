import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { setPin } from '@/lib/security/pin-engine';
import { StatusBar } from 'expo-status-bar';

const PIN_LENGTH = 4;

export default function SetPinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleDigit = useCallback((digit: string) => {
    setError('');
    if (step === 'create') {
      if (pin.length < PIN_LENGTH) setPin((p) => p + digit);
    } else {
      if (confirmPin.length < PIN_LENGTH) setConfirmPin((p) => p + digit);
    }
  }, [step, pin.length, confirmPin.length]);

  const handleDelete = useCallback(() => {
    setError('');
    if (step === 'create') {
      setPin((p) => p.slice(0, -1));
    } else {
      setConfirmPin((p) => p.slice(0, -1));
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (step === 'create') {
      if (pin.length === PIN_LENGTH) {
        setStep('confirm');
      }
      return;
    }

    if (confirmPin.length === PIN_LENGTH) {
      if (pin === confirmPin) {
        try {
          await setPin(pin);
          router.replace('/(os)');
        } catch (e: any) {
          setError(e.message || 'Failed to save PIN');
        }
      } else {
        Vibration.vibrate(200);
        setError('PINs do not match. Try again.');
        setConfirmPin('');
      }
    }
  }, [step, pin, confirmPin, router]);

  const currentPin = step === 'create' ? pin : confirmPin;

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < currentPin.length && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      ))}
    </View>
  );

  const renderKeypad = () => (
    <View style={styles.keypad}>
      {[
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'DEL'],
      ].map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key) => (
            <TouchableOpacity
              key={key || `empty-${rowIndex}`}
              style={[styles.key, !key && styles.keyEmpty]}
              onPress={() => {
                if (key === 'DEL') handleDelete();
                else if (key) handleDigit(key);
              }}
              activeOpacity={0.7}
            >
              {key === 'DEL' ? (
                <Text style={styles.keyTextDel}>⌫</Text>
              ) : key ? (
                <Text style={styles.keyText}>{key}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Set Your PIN</Text>
        <Text style={styles.subtitle}>
          {step === 'create' ? 'Create a 4-digit PIN' : 'Confirm your PIN'}
        </Text>
      </View>

      {renderDots()}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {renderKeypad()}

      <TouchableOpacity
        style={[styles.submitButton, currentPin.length !== PIN_LENGTH && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={currentPin.length !== PIN_LENGTH}
      >
        <Text style={styles.submitText}>
          {step === 'create' ? 'Continue' : 'Set PIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
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
    borderWidth: 2,
    borderColor: '#4b5563',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dotError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  keyTextDel: {
    fontSize: 22,
    color: '#9ca3af',
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  submitDisabled: {
    backgroundColor: '#374151',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
