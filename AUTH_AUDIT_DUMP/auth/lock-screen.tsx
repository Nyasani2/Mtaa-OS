import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyPin, getPinState, PinState, resetPinData } from '@/lib/security/pin-engine';
import { useIdentity } from '@/lib/auth/use-identity';

export default function LockScreen() {
  const router = useRouter();
  const { signOut } = useIdentity();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinState, setPinState] = useState<PinState | null>(null);
  const [shake, setShake] = useState(false);

  // Load PIN state on mount
  useEffect(() => {
    getPinState().then(setPinState);
  }, []);

  // ── PIN Entry ───────────────────────────────────────────────────────────────
  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 6 || loading) return;
    setError('');
    setPin(prev => prev + digit);
  }, [pin.length, loading]);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  // ── Verify PIN ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pin.length >= 4) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await verifyPin(pin);

      if (result.valid) {
        // Success — unlock
        setPin('');
        router.replace('/(os)');
        return;
      }

      // Wrong PIN
      Vibration.vibrate(200);
      setShake(true);
      setTimeout(() => setShake(false), 300);
      setPin('');

      if (result.state.isLocked) {
        const mins = result.state.lockoutEnd
          ? Math.ceil((result.state.lockoutEnd.getTime() - Date.now()) / 60000)
          : PIN_LOCKOUT_MINUTES;
        setError(`Too many attempts. Locked for ${mins} minutes.`);
      } else {
        setError(`Wrong PIN. ${result.state.attemptsRemaining} attempts remaining.`);
      }

      setPinState(result.state);
    } catch (err: any) {
      console.error('[LockScreen] Verify error:', err);
      setError('Unable to verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pin, loading, router]);

  // ── Emergency Unlock ────────────────────────────────────────────────────────
  const handleEmergencyUnlock = useCallback(() => {
    Alert.alert(
      'Emergency Unlock',
      'This will clear your PIN and require re-authentication. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          style: 'destructive',
          onPress: async () => {
            await resetPinData();
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  }, [router, signOut]);

  // ── Render Keypad ───────────────────────────────────────────────────────────
  const renderKeypad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace'],
    ];

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.keypadRow}>
        {row.map((key) => (
          <TouchableOpacity
            key={key || `empty-${rowIndex}`}
            style={[
              styles.keypadButton,
              key === '' && styles.keypadButtonEmpty,
            ]}
            onPress={() => {
              if (key === 'backspace') handleBackspace();
              else if (key) handleDigit(key);
            }}
            disabled={key === '' || loading}
            activeOpacity={0.7}
          >
            {key === 'backspace' ? (
              <Ionicons name="backspace" size={24} color="#374151" />
            ) : key ? (
              <Text style={styles.keypadText}>{key}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={48} color="#4F46E5" />
        <Text style={styles.title}>Device Locked</Text>
        <Text style={styles.subtitle}>Enter your PIN to unlock</Text>
      </View>

      {/* PIN Dots */}
      <View style={[styles.dotsContainer, shake && styles.shake]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              pin.length > i ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Lockout info */}
      {pinState?.isLocked && pinState.lockoutEnd ? (
        <Text style={styles.lockoutText}>
          Locked until {pinState.lockoutEnd.toLocaleTimeString()}
        </Text>
      ) : null}

      {/* Keypad */}
      <View style={styles.keypadContainer}>{renderKeypad()}</View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}

      {/* Emergency unlock */}
      <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyUnlock}>
        <Text style={styles.emergencyText}>Forgot PIN?</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Constants ───────────────────────────────────────────────────────────────────
const PIN_LOCKOUT_MINUTES = 30;

// ── Styles ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    marginTop: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  shake: {
    transform: [{ translateX: -5 }],
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  dotFilled: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  lockoutText: {
    color: '#F59E0B',
    fontSize: 13,
    marginBottom: 16,
  },
  keypadContainer: {
    marginTop: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keypadText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButton: {
    marginTop: 32,
    paddingVertical: 8,
  },
  emergencyText: {
    color: '#6B7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
