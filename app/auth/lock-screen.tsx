import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { verifyPin } from '@/lib/security/pin-engine';
import { Ionicons } from '@expo/vector-icons';

const PIN_LENGTH = 6;

export default function LockScreen() {
  const router = useRouter();
  const { user, logout, biometricEnabled, updateLastActivity } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [locked, setLocked] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (biometricEnabled) {
      attemptBiometric();
    }
  }, [biometricEnabled]);

  const attemptBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock MTAA',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: true,
      });

      if (result.success) {
        updateLastActivity();
        router.replace('/(os)');
      }
    } catch {
      // Fall through to PIN
    }
  };

  const handleDigit = useCallback(
    async (digit: string) => {
      if (locked || loading) return;

      if (pin.length < PIN_LENGTH) {
        const newPin = pin + digit;
        setPin(newPin);

        if (newPin.length === PIN_LENGTH) {
          setLoading(true);
          const result = await verifyPin(newPin, userId || '');
          setLoading(false);

          if (result.valid) {
            updateLastActivity();
            setPin('');
            router.replace('/(os)');
          } else {
            setPin('');
            setShake(true);
            setTimeout(() => setShake(false), 500);

            if (result.locked_until) {
              setLocked(true);
              setLockoutUntil(result.locked_until);
              setAttemptsLeft(0);
            } else {
              const remaining = result.attempts_remaining ?? Math.max(0, attemptsLeft - 1);
              setAttemptsLeft(remaining);

              if (remaining <= 0) {
                setLocked(true);
              } else {
                Alert.alert('Incorrect PIN', `${remaining} attempts remaining`);
              }
            }
          }
        }
      }
    },
    [pin, userId, locked, loading, attemptsLeft, updateLastActivity]
  );

  const handleDelete = () => {
    if (!locked) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out?',
      'You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length && styles.dotFilled,
            shake && styles.dotShake,
          ]}
        />
      ))}
    </View>
  );

  const renderKeypad = () => (
    <View style={styles.keypad}>
      {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['bio', '0', 'del']].map(
        (row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.key, key === '' && styles.keyEmpty]}
                onPress={() => {
                  if (key === 'del') handleDelete();
                  else if (key === 'bio') attemptBiometric();
                  else if (key !== '') handleDigit(key);
                }}
                disabled={locked}
              >
                {key === 'del' ? (
                  <Ionicons name="backspace-outline" size={24} color="#fff" />
                ) : key === 'bio' ? (
                  <Ionicons name="finger-print-outline" size={28} color="#00d4aa" />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )
      )}
    </View>
  );

  if (locked) {
    return (
      <SafeAreaView style={styles.container}>
        <Ionicons name="lock-closed" size={64} color="#e74c3c" style={{ marginBottom: 24 }} />
        <Text style={styles.lockedTitle}>Too Many Attempts</Text>
        <Text style={styles.lockedText}>
          {lockoutUntil
            ? `Try again at ${new Date(lockoutUntil).toLocaleTimeString()}`
            : 'Your account has been temporarily locked.'}
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={48} color="#00d4aa" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Enter PIN</Text>
        <Text style={styles.subtitle}>
          {biometricEnabled ? 'Or use biometric authentication' : 'Secure your session'}
        </Text>
      </View>

      {renderDots()}

      {attemptsLeft < 5 && (
        <Text style={styles.attemptsText}>{attemptsLeft} attempts remaining</Text>
      )}

      {renderKeypad()}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    borderColor: '#444',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#00d4aa',
    borderColor: '#00d4aa',
  },
  dotShake: {
    borderColor: '#e74c3c',
    backgroundColor: '#e74c3c22',
  },
  attemptsText: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 16,
  },
  keypad: {
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    marginTop: 32,
    padding: 12,
  },
  logoutText: {
    color: '#888',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
});
