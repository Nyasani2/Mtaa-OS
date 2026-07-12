import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { verifyPin, getPinState, clearPin } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const MAX_LENGTH = 6;
const MIN_LENGTH = 4;

export default function LockScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const signOut = useAuthStore((state) => state.signOut);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Load initial state
  useEffect(() => {
    getPinState().then((state) => {
      setAttemptsLeft(state.attemptsRemaining);
      setIsLocked(state.isLocked);
      if (state.lockoutUntil) {
        const remaining = Math.ceil((state.lockoutUntil - Date.now()) / 1000);
        setLockoutTimer(Math.max(0, remaining));
      }
    });
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  const handleDigit = useCallback((digit: string) => {
    if (isLocked) return;
    setError('');
    if (pin.length < MAX_LENGTH) {
      setPin((prev) => prev + digit);
    }
  }, [pin, isLocked]);

  const handleBackspace = useCallback(() => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length < MIN_LENGTH) {
      setError(`Enter at least ${MIN_LENGTH} digits`);
      return;
    }
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
        setLockoutTimer(Math.max(0, remaining));
        setError(`Too many attempts. Locked for ${Math.ceil(remaining / 60)} min.`);
      } else {
        setError(`Wrong PIN. ${state.attemptsRemaining} attempts left.`);
      }
    }
  }, [pin, router]);

  // Auto-submit when PIN reaches max length
  useEffect(() => {
    if (pin.length === MAX_LENGTH) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  const handleForgotPin = useCallback(async () => {
    await clearPin();
    await signOut();
    router.replace('/auth/login');
  }, [router, signOut]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#f8f9fa' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a2e' }]}>
        Enter PIN
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        {isLocked && lockoutTimer > 0
          ? `Locked. Retry in ${formatTime(lockoutTimer)}`
          : 'Unlock your device'}
      </Text>

      {/* PIN Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: MAX_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length
                  ? '#6366f1'
                  : isDark ? '#374151' : '#e5e7eb',
                opacity: i >= MIN_LENGTH && i >= pin.length ? 0.3 : 1,
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
            style={[
              styles.key,
              digit === '' && { opacity: 0 },
              isLocked && { opacity: 0.3 },
            ]}
            onPress={() => {
              if (isLocked) return;
              if (digit === 'back') handleBackspace();
              else if (digit !== '') handleDigit(digit);
            }}
            disabled={digit === '' || isLocked}
          >
            <Text style={[styles.keyText, { color: isDark ? '#fff' : '#1a1a2e' }]}>
              {digit === 'back' ? '⌫' : digit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button (for 4-5 digit PINs) */}
      {pin.length >= MIN_LENGTH && pin.length < MAX_LENGTH && !isLocked && (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      )}

      {/* Forgot PIN */}
      <TouchableOpacity onPress={handleForgotPin} style={styles.forgotLink}>
        <Text style={{ color: '#6366f1', fontSize: 14 }}>Forgot PIN? Sign out</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotLink: {
    marginTop: 8,
  },
});
