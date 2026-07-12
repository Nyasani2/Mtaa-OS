import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { verifyPin, getPinState, clearPin } from '@/lib/security/pin-engine';
import { StatusBar } from 'expo-status-bar';

const PIN_LENGTH = 4;

export default function LockScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Check lockout state on mount
  useEffect(() => {
    getPinState().then((state) => {
      setAttemptsLeft(state.attemptsRemaining);
      setIsLocked(state.isLocked);
      if (state.lockoutUntil) {
        const remaining = Math.ceil((state.lockoutUntil - Date.now()) / 1000);
        setLockoutTimer(remaining > 0 ? remaining : 0);
      }
    });
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((t) => {
        if (t <= 1) {
          setIsLocked(false);
          getPinState().then((s) => setAttemptsLeft(s.attemptsRemaining));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Prevent back navigation
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        getPinState().then((state) => {
          if (state.isLocked) {
            setIsLocked(true);
            setLockoutTimer(state.lockoutUntil ? Math.ceil((state.lockoutUntil - Date.now()) / 1000) : 0);
          }
        });
      }
    });
    return () => sub.remove();
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (isLocked || pin.length >= PIN_LENGTH) return;
    setError('');
    setPin((p) => p + digit);
  }, [isLocked, pin.length]);

  const handleDelete = useCallback(() => {
    setPin((p) => p.slice(0, -1));
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) return;

    const valid = await verifyPin(pin);
    if (valid) {
      setPin('');
      setError('');
      router.replace('/(os)');
    } else {
      Vibration.vibrate(200);
      setPin('');
      const state = await getPinState();
      setAttemptsLeft(state.attemptsRemaining);
      setIsLocked(state.isLocked);
      if (state.isLocked && state.lockoutUntil) {
        const remaining = Math.ceil((state.lockoutUntil - Date.now()) / 1000);
        setLockoutTimer(remaining > 0 ? remaining : 0);
        setError(`Too many attempts. Locked for ${Math.ceil(remaining / 60)} minutes.`);
      } else {
        setError(`Wrong PIN. ${state.attemptsRemaining} attempts left.`);
      }
    }
  }, [pin, router]);

  const handleForgotPin = useCallback(async () => {
    // Sign out and redirect to login for recovery
    await useAuthStore.getState().signOut();
    router.replace('/auth/login');
  }, [router]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  const renderDots = () => (
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
              style={[
                styles.key,
                !key && styles.keyEmpty,
              ]}
              onPress={() => {
                if (key === 'DEL') handleDelete();
                else if (key) handleDigit(key);
              }}
              activeOpacity={0.7}
              disabled={isLocked}
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
        <Text style={styles.title}>MTAA OS</Text>
        <Text style={styles.subtitle}>Enter PIN to unlock</Text>
      </View>

      {renderDots()}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.attemptsText}>
          {isLocked ? `Locked. Try again in ${lockoutTimer}s` : `${attemptsLeft} attempts remaining`}
        </Text>
      )}

      {renderKeypad()}

      <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPin}>
        <Text style={styles.forgotText}>Forgot PIN?</Text>
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
    backgroundColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  attemptsText: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 24,
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
  forgotButton: {
    marginTop: 32,
    padding: 12,
  },
  forgotText: {
    color: '#6366f1',
    fontSize: 14,
  },
});
