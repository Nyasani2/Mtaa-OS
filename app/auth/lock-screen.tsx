import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { verifyPin, getPinState, clearPin } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useOSShell } from '@/lib/shell/use-os-shell';

const MAX_LENGTH = 6;
const MIN_LENGTH = 4;

export default function LockScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const signOut = useAuthStore((s) => s.signOut);
  const { unlock } = useOSShell();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Refresh PIN state on mount
  useEffect(() => {
    refreshState();
  }, []);

  // Check lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      if (Date.now() >= lockoutUntil) {
        setIsLocked(false);
        setLockoutUntil(null);
        setError('');
        refreshState();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const refreshState = async () => {
    try {
      const state = await getPinState();
      setAttemptsRemaining(state.attemptsRemaining);
      setIsLocked(state.isLocked);
      setLockoutUntil(state.lockoutUntil);
    } catch (e) {
      console.error('[LockScreen] Failed to refresh PIN state:', e);
    }
  };

  const handleDigit = useCallback((digit: string) => {
    if (isLocked || loading) return;
    setError('');
    if (pin.length < MAX_LENGTH) {
      setPin((prev) => prev + digit);
    }
  }, [pin, isLocked, loading]);

  const handleBackspace = useCallback(() => {
    if (isLocked || loading) return;
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }, [isLocked, loading]);

  const handleUnlock = useCallback(async () => {
    if (pin.length < MIN_LENGTH) {
      setError(`Enter at least ${MIN_LENGTH} digits`);
      Vibration.vibrate(200);
      return;
    }
    if (isLocked) {
      setError('PIN locked. Please wait.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const valid = await verifyPin(pin);
      if (valid) {
        setPin('');
        setError('');
        // CRITICAL: Call unlock() to tell OSShellProvider we're unlocked
        unlock();
        // Navigate to OS home
        router.replace('/(os)');
      } else {
        await refreshState();
        const state = await getPinState();
        if (state.isLocked) {
          setIsLocked(true);
          setLockoutUntil(state.lockoutUntil);
          setError(`Locked. Try again in ${Math.ceil((state.lockoutUntil! - Date.now()) / 1000)}s`);
        } else {
          setError(`Invalid PIN. ${state.attemptsRemaining} attempts remaining.`);
        }
        Vibration.vibrate(200);
        setPin('');
      }
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }, [pin, isLocked, unlock, router]);

  // Auto-submit when PIN reaches expected length
  useEffect(() => {
    if (pin.length >= MIN_LENGTH && pin.length <= MAX_LENGTH && !loading && !isLocked) {
      handleUnlock();
    }
  }, [pin, handleUnlock, loading, isLocked]);

  const handleForgotPin = useCallback(() => {
    Alert.alert(
      'Forgot PIN?',
      'You will be logged out and need to sign in again. Your PIN will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearPin();
              await signOut();
              // Force navigation to auth screen
              router.replace('/auth');
            } catch (e) {
              console.error('[LockScreen] Forgot PIN error:', e);
              // Even if clearPin fails, force logout
              await signOut();
              router.replace('/auth');
            }
          },
        },
      ]
    );
  }, [signOut, router]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  const lockoutText = isLocked && lockoutUntil
    ? `Locked. Try again in ${Math.ceil((lockoutUntil - Date.now()) / 1000)}s`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#f8f9fa' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a2e' }]}>
        Enter PIN
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        Unlock your MTAA OS
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
      {lockoutText ? <Text style={styles.errorText}>{lockoutText}</Text> : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {digits.map((digit, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.key,
              digit === '' && { opacity: 0 },
              (isLocked || loading) && digit !== '' && { opacity: 0.3 },
            ]}
            onPress={() => {
              if (digit === 'back') handleBackspace();
              else if (digit !== '') handleDigit(digit);
            }}
            disabled={digit === '' || isLocked || loading}
            activeOpacity={0.6}
          >
            {loading && digit === '' ? (
              <ActivityIndicator color="#6366f1" />
            ) : (
              <Text style={[styles.keyText, { color: isDark ? '#fff' : '#1a1a2e' }]}>
                {digit === 'back' ? '⌫' : digit}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Forgot PIN */}
      <TouchableOpacity onPress={handleForgotPin} style={styles.forgotLink}>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>Forgot PIN?</Text>
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
  forgotLink: {
    marginTop: 8,
  },
});
