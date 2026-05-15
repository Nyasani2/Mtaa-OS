import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert(
          'Session Expired',
          'The reset link has expired or is invalid. Please request a new one.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
        );
      }
      setSessionChecked(true);
    };
    checkSession();
  }, []);

  const handleChange = async () => {
    if (password.length < 6) {
      Alert.alert('Too Short', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Update Failed', error.message);
      return;
    }

    Alert.alert(
      'Password Updated',
      'Your password has been changed. Please log in with your new password.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  };

  if (!sessionChecked) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>Enter your new password below.</Text>

      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChange={setPassword}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={confirm}
        onChange={setConfirm}
        editable={!loading}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleChange} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 32, lineHeight: 20 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
