import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { setPin } from '@/lib/security/pin-engine';

export default function SetPinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const PIN_LENGTH = 6;

  const handlePress = (digit: string) => {
    if (step === 'create' && pin.length < PIN_LENGTH) {
      setPin(prev => prev + digit);
    } else if (step === 'confirm' && confirmPin.length < PIN_LENGTH) {
      setConfirmPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  useState(() => {
    if (pin.length === PIN_LENGTH && step === 'create') {
      setStep('confirm');
    }
  });

  // Watch for PIN completion
  React.useEffect(() => {
    if (pin.length === PIN_LENGTH && step === 'create') {
      const timer = setTimeout(() => setStep('confirm'), 200);
      return () => clearTimeout(timer);
    }
  }, [pin, step]);

  React.useEffect(() => {
    if (confirmPin.length === PIN_LENGTH && step === 'confirm') {
      handleSubmit();
    }
  }, [confirmPin, step]);

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      Alert.alert('PINs Do Not Match', 'Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('create');
      return;
    }

    setLoading(true);
    try {
      await setPin(pin);
      Alert.alert('PIN Set', 'Your PIN has been set successfully.', [
        { text: 'OK', onPress: () => router.replace('/(os)') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not set PIN');
      setPin('');
      setConfirmPin('');
      setStep('create');
    } finally {
      setLoading(false);
    }
  };

  const renderDots = (value: string) => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[styles.dot, i < value.length && styles.dotFilled]}
        />
      );
    }
    return dots;
  };

  const currentValue = step === 'create' ? pin : confirmPin;

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={48} color="#10b981" style={styles.lockIcon} />
      <Text style={styles.title}>
        {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 'create'
          ? 'Set a 6-digit PIN to secure your session'
          : 'Re-enter your PIN to confirm'}
      </Text>

      <View style={styles.dotsContainer}>
        {renderDots(currentValue)}
      </View>

      {loading && <ActivityIndicator color="#10b981" style={{ marginBottom: 12 }} />}

      <View style={styles.keypad}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keypadRow}>
            {row.map(digit => (
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
          <View style={[styles.key, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
          <TouchableOpacity style={styles.key} onPress={() => handlePress('0')} disabled={loading}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={handleBackspace} disabled={loading || currentValue.length === 0}>
            <Ionicons name="backspace-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {step === 'confirm' && (
        <TouchableOpacity onPress={() => { setStep('create'); setConfirmPin(''); }}>
          <Text style={styles.backText}>Start Over</Text>
        </TouchableOpacity>
      )}
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
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
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
  backText: {
    color: '#3b82f6',
    fontSize: 14,
    marginTop: 16,
  },
});
