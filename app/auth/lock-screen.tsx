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
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function LockScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const [pin, setPin] = useState('');
  const [pinState, setPinState] = useState<PinState>({
    isSet: true,
    isLocked: false,
    attemptsRemaining: 3,
    lockoutUntil: null,
  });
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const PIN_LENGTH = 6;

  const refreshState = useCallback(async () => {
    const state = await getPinState();
    setPinState(state);
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const handlePress = (digit: string) => {
    if (pin.length < PIN_LENGTH && !pinState.isLocked) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleVerify = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) return;

    setLoading(true);
    const valid = await verifyPin(pin);
    setLoading(false);

    if (valid) {
      router.replace('/(os)');
    } else {
      Vibration.vibrate(200);
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
      setPin('');
      await refreshState();
    }
  }, [pin, router, refreshState]);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleVerify();
    }
  }, [pin, handleVerify]);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await resetPinData();
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot PIN?',
      'This will clear your PIN and log you out. You will need to log in again and set a new PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset PIN',
          style: 'destructive',
          onPress: async () => {
            await resetPinData();
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      const filled = i < pin.length;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            filled && styles.dotFilled,
            shaking && styles.dotError,
          ]}
        />
      );
    }
    return dots;
  };

  if (pinState.isLocked) {
    const minutes = pinState.lockoutUntil
      ? Math.ceil((pinState.lockoutUntil - Date.now()) / 60000)
      : 5;
    return (
      <View style={styles.container}>
        <Ionicons name="lock-closed" size={48} color="#ef4444" />
        <Text style={styles.title}>PIN Locked</Text>
        <Text style={styles.subtitle}>
          Too many failed attempts.{"\n"}Try again in {minutes} minute{minutes !== 1 ? 's' : ''}.
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name="lock-closed-outline"
        size={48}
        color="#10b981"
        style={styles.lockIcon}
      />
      <Text style={styles.title}>Enter PIN</Text>
      <Text style={styles.subtitle}>Secure your session</Text>

      <View style={[styles.dotsContainer, shaking && styles.shake]}>
        {renderDots()}
      </View>

      <Text
        style={[
          styles.attemptsText,
          pinState.attemptsRemaining <= 2 && styles.attemptsWarning,
        ]}
      >
        {pinState.attemptsRemaining} attempt
        {pinState.attemptsRemaining !== 1 ? 's' : ''} remaining
      </Text>

      {loading && <ActivityIndicator color="#10b981" style={{ marginBottom: 12 }} />}

      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keypadRow}>
            {row.map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.key}
                onPress={() => handlePress(digit)}
                disabled={loading}
              >
                <Text style={styles.keyText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.key} disabled>
            <Ionicons name="finger-print" size={28} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.key}
            onPress={() => handlePress('0')}
            disabled={loading}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.key}
            onPress={handleBackspace}
            disabled={loading || pin.length === 0}
          >
            <Ionicons name="backspace-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleForgotPin}>
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockIcon: { marginBottom: 16 },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  shake: {
    transform: [{ translateX: -5 }],
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dotError: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  attemptsText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
  },
  attemptsWarning: {
    color: '#f97316',
    fontWeight: '700',
  },
  keypad: {
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  keyText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  forgotText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutText: {
    color: '#64748b',
    fontSize: 14,
  },
  logoutBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
