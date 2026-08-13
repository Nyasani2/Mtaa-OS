import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
} from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface UnlockScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PIN_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export function UnlockScreen({ onSuccess, onCancel }: UnlockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const { verifyPin } = useAuthStore();

  const handleKeyPress = useCallback(
    async (key: string) => {
      setError(null);

      if (key === 'del') {
        setPin((prev) => prev.slice(0, -1));
        return;
      }

      if (key === '') return;

      const newPin = pin + key;
      if (newPin.length > 4) return;

      setPin(newPin);

      if (newPin.length === 4) {
        const isValid = await verifyPin(newPin);
        if (isValid) {
          onSuccess();
        } else {
          Vibration.vibrate(200);
          setShaking(true);
          setError('Incorrect PIN. Try again.');
          setPin('');
          setTimeout(() => setShaking(false), 300);
        }
      }
    },
    [pin, verifyPin, onSuccess]
  );

  const renderDot = (index: number) => (
    <View
      key={index}
      style={[
        styles.dot,
        pin.length > index && styles.dotFilled,
        shaking && styles.dotError,
      ]}
    />
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={48} color="#00d4ff" />
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.subtitle}>Unlock MTAA to continue</Text>
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

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    alignItems: 'center',
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
  cancelBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '500',
  },
});
