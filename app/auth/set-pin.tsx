import React, { useState, useCallback } from 'react';
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
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { setPin, validatePinStrength, hasPin } from '@/lib/security/pin-engine';
import { Ionicons } from '@expo/vector-icons';

const PIN_LENGTH = 6;

export default function SetPinScreen() {
  const router = useRouter();
  const { user, setPinSet } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm' | 'strength'>('create');
  const [strength, setStrength] = useState<{ score: number; label: string; color: string }>({
    score: 0,
    label: '',
    color: '#ccc',
  });
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const userId = user?.id;

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Authentication required</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleDigit = useCallback(
    (digit: string) => {
      if (step === 'create') {
        if (pin.length < PIN_LENGTH) {
          const newPin = pin + digit;
          setPin(newPin);
          if (newPin.length === PIN_LENGTH) {
            const validation = validatePinStrength(newPin);
            if (!validation.valid) {
              Alert.alert('Weak PIN', validation.reason);
              setPin('');
              setShake(true);
              setTimeout(() => setShake(false), 500);
              return;
            }
            // Calculate strength score
            const score = calculateStrengthScore(newPin);
            setStrength(score);
            setStep('strength');
          }
        }
      } else if (step === 'confirm') {
        if (confirmPin.length < PIN_LENGTH) {
          const newConfirm = confirmPin + digit;
          setConfirmPin(newConfirm);
          if (newConfirm.length === PIN_LENGTH) {
            handleConfirm(newConfirm);
          }
        }
      }
    },
    [pin, confirmPin, step, userId]
  );

  const calculateStrengthScore = (p: string) => {
    let score = 0;
    const unique = new Set(p.split('')).size;
    score += unique * 15;
    if (!/^(\d)\1{5}$/.test(p)) score += 20;
    if (!['012345','123456','234567'].some(s => p.includes(s))) score += 20;
    if (unique >= 4) score += 20;
    if (unique >= 5) score += 25;

    score = Math.min(100, score);
    if (score < 40) return { score, label: 'Weak', color: '#e74c3c' };
    if (score < 70) return { score, label: 'Fair', color: '#f39c12' };
    if (score < 90) return { score, label: 'Strong', color: '#27ae60' };
    return { score, label: 'Very Strong', color: '#2ecc71' };
  };

  const handleConfirm = async (confirmedPin: string) => {
    if (confirmedPin !== pin) {
      Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
      setConfirmPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    const result = await setPin(pin, userId);
    setLoading(false);

    if (result.success) {
      setPinSet(true);
      Alert.alert(
        'PIN Set Successfully',
        'Your PIN has been secured. You can now enable biometric authentication.',
        [
          {
            text: 'Enable Biometric',
            onPress: () => router.push('/auth/biometric-enroll'),
          },
          {
            text: 'Skip for Now',
            onPress: () => router.replace('/(os)'),
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to set PIN');
      setPin('');
      setConfirmPin('');
      setStep('create');
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setConfirmPin('');
      setStep('create');
    } else if (step === 'strength') {
      setStep('create');
      setPin('');
    }
  };

  const renderDots = () => {
    const current = step === 'confirm' ? confirmPin : pin;
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < current.length && styles.dotFilled,
              shake && styles.dotShake,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => (
    <View style={styles.keypad}>
      {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'del']].map(
        (row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.key, key === '' && styles.keyEmpty]}
                onPress={() => {
                  if (key === 'del') handleDelete();
                  else if (key !== '') handleDigit(key);
                }}
                disabled={key === ''}
              >
                {key === 'del' ? (
                  <Ionicons name="backspace-outline" size={24} color="#fff" />
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

  const renderStrengthMeter = () => (
    <View style={styles.strengthContainer}>
      <Text style={styles.strengthTitle}>PIN Strength</Text>
      <View style={styles.strengthBar}>
        <View
          style={[
            styles.strengthFill,
            { width: `${strength.score}%`, backgroundColor: strength.color },
          ]}
        />
      </View>
      <Text style={[styles.strengthLabel, { color: strength.color }]}>
        {strength.label}
      </Text>
      <Text style={styles.strengthHint}>
        Avoid sequential numbers, repeated digits, and date patterns.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setStep('confirm')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Change PIN</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {step === 'create' && 'Create PIN'}
          {step === 'strength' && 'PIN Strength'}
          {step === 'confirm' && 'Confirm PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create' && 'Choose a 6-digit PIN to secure your wallet'}
          {step === 'strength' && 'Review your PIN strength'}
          {step === 'confirm' && 'Re-enter your PIN to confirm'}
        </Text>
      </View>

      {step !== 'strength' && renderDots()}
      {step === 'strength' && renderStrengthMeter()}
      {step !== 'strength' && renderKeypad()}

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Securing your PIN...</Text>
        </View>
      )}

      {step === 'confirm' && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
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
  strengthContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  strengthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  strengthBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  strengthHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#00d4aa',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    color: '#888',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 16,
  },
});
