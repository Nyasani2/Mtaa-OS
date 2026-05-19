import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { email: paramEmail } = useLocalSearchParams();

  useEffect(() => {
    if (paramEmail) setEmail(paramEmail as string);
  }, [paramEmail]);

  const handleVerify = async () => {
    if (!code.trim() || code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'signup',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Verification Failed', error.message);
      return;
    }

    Alert.alert(
      'Verified',
      'Your email has been verified. Welcome to MTAA OS.',
      [{ text: 'Continue', onPress: () => router.replace('/(os)/launcher') }]
    );
  };

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert('No Email', 'Please go back and register again');
      return;
    }

    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    setResendLoading(false);

    if (error) {
      Alert.alert('Resend Failed', error.message);
    } else {
      Alert.alert('Sent', 'A new verification code has been sent to your email');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {email || 'your email'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="6-digit code"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChange={setCode}
        editable={!loading}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resendLoading || loading}>
        <Text style={styles.link}>
          {resendLoading ? 'Sending...' : 'Resend Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(auth)/register')} disabled={loading}>
        <Text style={styles.link}>Use Different Email</Text>
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
    textAlign: 'center',
    letterSpacing: 8,
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
  link: { color: '#6366f1', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
