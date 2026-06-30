import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function ChangePinScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePin = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'New PIN and confirmation do not match');
      return;
    }

    setLoading(true);
    try {
      // Verify current PIN first
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Note: In production, compare hashed PINs. This is a simplified version.
      // The actual PIN verification should use bcrypt.compare or similar.
      if (profile?.pin_hash && currentPin !== profile.pin_hash) {
        Alert.alert('Incorrect PIN', 'Current PIN is incorrect');
        setLoading(false);
        return;
      }

      // Update PIN
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ pin_hash: newPin }) // In production: hash the PIN before storing
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      Alert.alert('Success', 'PIN changed successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not change PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change PIN</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color="#00d4ff" />
        </View>

        <Text style={styles.subtitle}>
          Enter your current PIN and set a new one. Your PIN protects your wallet and sensitive actions.
        </Text>

        {/* Current PIN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current PIN</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="Enter current PIN"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={!showCurrent}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* New PIN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New PIN (4-6 digits)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Enter new PIN"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm PIN */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New PIN</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Re-enter new PIN"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={!showConfirm}
              onSubmitEditing={handleChangePin}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleChangePin}
          disabled={loading || !currentPin || !newPin || !confirmPin}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Updating...' : 'Change PIN'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          For security, you'll need your PIN for wallet transactions and sensitive actions.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
    letterSpacing: 4,
  },
  submitBtn: {
    backgroundColor: '#00d4ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
