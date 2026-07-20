import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hasPin, verifyPin } from '@/lib/security/pin-engine';

const PIN_LENGTH = 6;

interface WalletPinGuardProps {
  children: React.ReactNode;
}

export default function WalletPinGuard({ children }: WalletPinGuardProps) {
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    checkPin();
  }, []);

  const checkPin = async () => {
    const hasPinSet = await hasPin();
    setPinSet(hasPinSet);
    if (!hasPinSet) {
      // No PIN set - allow access (or you could redirect to set-pin)
      setUnlocked(true);
    }
  };

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    Vibration.vibrate(10);
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => handleSubmit(newPin), 150);
    }
  }, [pin]);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSubmit = async (pinToVerify: string) => {
    const valid = await verifyPin(pinToVerify);

    if (valid) {
      Vibration.vibrate([0, 50, 50, 50]);
      setUnlocked(true);
      setPin('');
      setError('');
      setAttempts(0);
    } else {
      Vibration.vibrate([0, 100, 50, 100]);
      setPin('');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`Incorrect PIN. ${5 - newAttempts} attempts remaining.`);
    }
  };

  // Loading state
  if (pinSet === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ color: '#666', marginTop: 16 }}>Checking security...</Text>
      </View>
    );
  }

  // Unlocked or no PIN set - show wallet content
  if (unlocked || !pinSet) {
    return <>{children}</>;
  }

  // PIN required - show PIN entry inline (don't navigate away!)
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="wallet" size={48} color="#ef4444" style={{ marginBottom: 12 }} />
        <Text style={styles.title}>Wallet Locked</Text>
        <Text style={styles.subtitle}>Enter your PIN to access your wallet</Text>

        <View style={styles.dotsContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.numpad}>
          {digits.map((digit, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.digitButton, !digit && styles.digitButtonEmpty]}
              onPress={() => digit && handleDigit(digit)}
              disabled={!digit}
              activeOpacity={0.7}
            >
              {digit === '' ? (
                <TouchableOpacity
                  onPress={handleBackspace}
                  disabled={pin.length === 0}
                  style={styles.backspaceButton}
                >
                  <Ionicons name="backspace-outline" size={24} color={pin.length === 0 ? '#444' : '#fff'} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.digitText}>{digit}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  dotError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: 280,
    marginBottom: 24,
  },
  digitButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitButtonEmpty: {
    backgroundColor: 'transparent',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  backspaceButton: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
