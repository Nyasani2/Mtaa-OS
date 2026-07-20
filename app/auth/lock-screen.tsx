import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyPin, clearPin, getPinState } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const PIN_LENGTH = 6;

export default function LockScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const { signOut } = useAuthStore();

  // Check lockout status on mount
  useEffect(() => {
    checkLockoutStatus();
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutEndTime || !isLocked) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / 1000);

      if (diff <= 0) {
        setIsLocked(false);
        setLockoutEndTime(null);
        setCountdown(0);
        setAttempts(0);
        clearInterval(interval);
      } else {
        setCountdown(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutEndTime, isLocked]);

  const checkLockoutStatus = async () => {
    const state = await getPinState();
    if (state.isLocked && state.lockoutUntil) {
      const remaining = state.lockoutUntil - Date.now();
      if (remaining > 0) {
        setIsLocked(true);
        setLockoutEndTime(new Date(state.lockoutUntil));
        setCountdown(Math.ceil(remaining / 1000));
        setAttempts(5 - state.attemptsRemaining);
      }
    }
  };

  const handleDigit = useCallback((digit: string) => {
    if (isLocked) return;
    if (pin.length >= PIN_LENGTH) return;

    Vibration.vibrate(10);
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    // Auto-submit when PIN is complete
    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => handleSubmit(newPin), 150);
    }
  }, [pin, isLocked]);

  const handleBackspace = useCallback(() => {
    if (isLocked) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [isLocked]);

  const handleSubmit = async (pinToVerify: string) => {
    if (isLocked) return;

    const valid = await verifyPin(pinToVerify);

    if (valid) {
      Vibration.vibrate([0, 50, 50, 50]);
      setPin('');
      setError('');
      setAttempts(0);
      setIsLocked(false);
      setLockoutEndTime(null);

      // Navigate back or to home
      if (returnTo && returnTo !== 'auth/lock-screen') {
        router.replace(`/${returnTo}` as any);
      } else {
        router.replace('/(os)');
      }
    } else {
      Vibration.vibrate([0, 100, 50, 100]);
      setPin('');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Re-check lockout state after failed attempt
      const state = await getPinState();
      if (state.isLocked && state.lockoutUntil) {
        const remaining = state.lockoutUntil - Date.now();
        if (remaining > 0) {
          setIsLocked(true);
          setLockoutEndTime(new Date(state.lockoutUntil));
          setCountdown(Math.ceil(remaining / 1000));
          setError(`Too many attempts. Locked for ${Math.ceil(remaining / 1000)}s.`);
          return;
        }
      }

      setError(`Incorrect PIN. ${state.attemptsRemaining} attempts remaining.`);
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot PIN?',
      "This will sign you out. You\'ll need to log in again and set a new PIN.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearPin();
              await signOut();
              router.replace('/auth/login');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={48} color="#ef4444" style={{ marginBottom: 16 }} />

        <Text style={styles.title}>Enter PIN</Text>

        {isLocked ? (
          <Text style={styles.lockoutText}>
            Too many attempts. Try again in {countdown}s.
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            {5 - attempts} attempts remaining
          </Text>
        )}

        {/* PIN Dots */}
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

        {/* Numpad */}
        <View style={styles.numpad}>
          {digits.map((digit, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.digitButton, !digit && styles.digitButtonEmpty]}
              onPress={() => digit && handleDigit(digit)}
              disabled={!digit || isLocked}
              activeOpacity={0.7}
            >
              {digit === '' ? (
                <TouchableOpacity
                  onPress={handleBackspace}
                  disabled={pin.length === 0 || isLocked}
                  style={styles.backspaceButton}
                >
                  <Ionicons name="backspace-outline" size={24} color={pin.length === 0 || isLocked ? '#444' : '#fff'} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.digitText, isLocked && styles.digitTextDisabled]}>
                  {digit}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Forgot PIN */}
        <TouchableOpacity onPress={handleForgotPin} style={styles.forgotButton}>
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  lockoutText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 24,
    fontWeight: '600',
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
    borderColor: '#ccc',
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
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitButtonEmpty: {
    backgroundColor: 'transparent',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
  },
  digitTextDisabled: {
    color: '#ccc',
  },
  backspaceButton: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotButton: {
    paddingVertical: 8,
  },
  forgotText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
});
