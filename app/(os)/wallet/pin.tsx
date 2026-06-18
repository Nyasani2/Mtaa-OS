// app/(os)/wallet/pin.tsx
// FIXED: No external wallet store dependency — uses direct supabase + auth

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/useAuthStore';

const PIN_LENGTH = 6;

const hashPin = async (pin: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function WalletPinScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [pin, setPinState] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState<'check' | 'create' | 'confirm'>('check');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    if (!user?.id) {
      router.replace('/(os)/login');
      return;
    }

    const { data } = await supabase
      .from('wallet_pins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    setMode(data ? 'check' : 'create');
    setLoading(false);
  };

  const handleDigit = (digit: string) => {
    if (error) setError('');

    if (mode === 'check' || mode === 'create') {
      if (pin.length < PIN_LENGTH) {
        setPinState(pin + digit);
      }
    } else if (mode === 'confirm') {
      if (confirmPin.length < PIN_LENGTH) {
        setConfirmPin(confirmPin + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (error) setError('');

    if (mode === 'check' || mode === 'create') {
      setPinState(pin.slice(0, -1));
    } else if (mode === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  useEffect(() => {
    const currentPin = mode === 'confirm' ? confirmPin : pin;
    if (currentPin.length === PIN_LENGTH) {
      handleSubmit();
    }
  }, [pin, confirmPin]);

  const handleSubmit = async () => {
    if (!user?.id) return;

    if (mode === 'check') {
      const { data } = await supabase
        .from('wallet_pins')
        .select('pin_hash, salt')
        .eq('user_id', user.id)
        .single();

      if (!data) {
        setError('PIN not found. Please create one.');
        setMode('create');
        setPinState('');
        return;
      }

      const hashed = await hashPin(pin, data.salt);
      if (hashed === data.pin_hash) {
        router.replace('/(os)/wallet');
      } else {
        setError('Incorrect PIN. Please try again.');
        setPinState('');
      }
    } else if (mode === 'create') {
      setMode('confirm');
    } else if (mode === 'confirm') {
      if (pin === confirmPin) {
        const salt = Math.random().toString(36).substring(2, 15);
        const pinHash = await hashPin(pin, salt);

        const { error: upsertError } = await supabase
          .from('wallet_pins')
          .upsert({
            user_id: user.id,
            pin_hash: pinHash,
            salt: salt,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) {
          setError('Failed to save PIN. Please try again.');
          setMode('create');
          setPinState('');
          setConfirmPin('');
        } else {
          Alert.alert('PIN Set', 'Your wallet PIN has been created successfully.');
          router.replace('/(os)/wallet');
        }
      } else {
        setError('PINs do not match. Please try again.');
        setMode('create');
        setPinState('');
        setConfirmPin('');
      }
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Reset PIN',
      'You will need to verify your identity to reset your PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => router.push('/(os)/wallet/reset-pin') },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const currentPin = mode === 'confirm' ? confirmPin : pin;
  const title = mode === 'check' 
    ? 'Enter Wallet PIN' 
    : mode === 'create' 
    ? 'Create Wallet PIN' 
    : 'Confirm PIN';
  const subtitle = mode === 'check'
    ? 'Enter your 6-digit PIN to access your wallet'
    : mode === 'create'
    ? 'Create a 6-digit PIN to secure your wallet'
    : 'Re-enter your PIN to confirm';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="lock-closed" size={48} color="#6366f1" style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.pinRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < currentPin.length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.numpad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.numpadBtn}
              onPress={() => handleDigit(num.toString())}
            >
              <Text style={styles.numpadText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.numpadBtn} />
          <TouchableOpacity style={styles.numpadBtn} onPress={() => handleDigit('0')}>
            <Text style={styles.numpadText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.numpadBtn} onPress={handleBackspace}>
            <Ionicons name="backspace-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {mode === 'check' && (
          <TouchableOpacity onPress={handleForgotPin}>
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  icon: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 32 },

  pinRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  pinDotFilled: {
    backgroundColor: '#6366f1',
  },

  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
  },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
    gap: 12,
  },
  numpadBtn: {
    width: 72,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
  },
  numpadText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },

  forgotText: {
    color: '#6366f1',
    fontSize: 14,
    marginTop: 24,
  },
});
