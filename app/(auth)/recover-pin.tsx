import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function RecoverPinScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'verify' | 'auth'>('verify');
  const [loading, setLoading] = useState(false);

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Enter your email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      Alert.alert(
        'Check Your Email',
        'We sent a secure login link. Click it to verify your identity, then return here.',
        [{ text: 'OK', onPress: () => setStep('auth') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (error || !data.user) {
        Alert.alert('Error', error?.message || 'Authentication failed');
        return;
      }
      // Identity verified — allow new PIN
      router.replace('/create-pin');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="warning-outline" size={64} color="#f59e0b" />
          <Text style={styles.title}>Forgot Your PIN?</Text>
          <Text style={styles.subtitle}>
            For security, you must re-verify your identity before creating a new PIN.
          </Text>
        </View>

        {step === 'verify' ? (
          <View style={styles.form}>
            <Text style={styles.info}>
              We'll send a secure login link to your email. After clicking it, you can set a new PIN.
            </Text>
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSendMagicLink} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Secure Link</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.altBtn} onPress={() => setStep('auth')}>
              <Text style={styles.altText}>Use password instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.info}>
              Enter your password to verify your identity.
            </Text>
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handlePasswordAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Reset PIN</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  form: { gap: 16 },
  info: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, color: '#f8fafc', fontSize: 15 },
  btn: { backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  altBtn: { alignItems: 'center', marginTop: 8 },
  altText: { color: '#3b82f6', fontSize: 14, fontWeight: '500' },
  backBtn: { alignItems: 'center', marginTop: 32 },
  backText: { color: '#64748b', fontSize: 14 },
});
