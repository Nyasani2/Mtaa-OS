import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PIN_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

type PinStep = 'enter' | 'confirm';

export default function CreatePinScreen() {
  const router = useRouter();
  const { setPin, user } = useAuthStore();
  const [step, setStep] = useState<PinStep>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [secondPin, setSecondPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentPin = step === 'enter' ? firstPin : secondPin;
  const setCurrentPin = step === 'enter' ? setFirstPin : setSecondPin;

  const handleKeyPress = useCallback(
    async (key: string) => {
      setError(null);

      if (key === 'del') {
        setCurrentPin((prev) => prev.slice(0, -1));
        return;
      }

      if (key === '') return;

      const newPin = currentPin + key;
      if (newPin.length > 4) return;

      setCurrentPin(newPin);

      if (newPin.length === 4) {
        if (step === 'enter') {
          // Move to confirm step after a brief delay so user sees the 4th dot fill
          setTimeout(() => setStep('confirm'), 150);
        } else {
          // Confirm step complete
          if (newPin === firstPin) {
            setSaving(true);
            try {
              await setPin(newPin);
              router.replace('/(os)');
            } catch (err: any) {
              setError(err.message || 'Failed to save PIN');
              setSaving(false);
            }
          } else {
            Vibration.vibrate(200);
            setShaking(true);
            setError('PINs do not match. Try again.');
            setSecondPin('');
            setTimeout(() => {
              setShaking(false);
              setStep('enter');
              setFirstPin('');
            }, 800);
          }
        }
      }
    },
    [currentPin, step, firstPin, setCurrentPin, setPin, router]
  );

  const renderDot = (index: number) => (
    <View
      key={index}
      style={[
        styles.dot,
        currentPin.length > index && styles.dotFilled,
        shaking && styles.dotError,
      ]}
    />
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.subtitle}>Loading session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={48} color="#00d4ff" />
        <Text style={styles.title}>
          {step === 'enter' ? 'Create PIN' : 'Confirm PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'enter'
            ? 'Choose a 4-digit PIN to secure your account'
            : 'Re-enter your PIN to confirm'}
        </Text>
      </View>

      <View style={[styles.dotsRow, shaking && styles.shake]}>
        {[0, 1, 2, 3].map(renderDot)}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {saving ? (
        <ActivityIndicator size="large" color="#00d4ff" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.keypad}>
          {PIN_KEYS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key || `empty-${rowIndex}`}
                  style={[styles.key, key === '' && styles.keyEmpty]}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                >
                  {key === 'del' ? (
                    <Ionicons name="backspace-outline" size={24} color="#fff" />
                  ) : key ? (
                    <Text style={styles.keyText}>{key}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}

      {step === 'confirm' && !saving && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            setStep('enter');
            setFirstPin('');
            setSecondPin('');
            setError(null);
          }}
        >
          <Text style={styles.backText}>Start Over</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 280,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  shake: {
    transform: [{ translateX: 0 }],
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  dotError: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#ef444415',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  keypad: {
    width: width * 0.75,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  key: {
    width: (width * 0.75 - 24) / 3,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  backBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backText: {
    color: '#00d4ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
