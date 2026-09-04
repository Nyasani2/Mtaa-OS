import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    setError(null);
    if (!fullName.trim()) { setError('Full name is required'); return false; }
    if (!username.trim()) { setError('Username is required'); return false; }
    if (!email.trim() || !email.includes('@')) { setError('Valid email is required'); return false; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error: signupError } = await signUp(email.trim(), password, {
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
    });
    setLoading(false);
    if (signupError) {
      setError(signupError.message || 'Failed to create account. Please try again.');
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <Ionicons name="mail-outline" size={64} color="#00d4ff" />
          <Text style={styles.successTitle}>Verify Your Email</Text>
          <Text style={styles.successText}>
            We sent a confirmation link to {email}. Tap the link in your email to activate your account.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/login')}>
            <Text style={styles.primaryBtnText}>Go to Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/verify-email')}>
            <Text style={styles.secondaryBtnText}>I already verified</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join MTAA</Text>
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="rgba(255,255,255,0.4)"
          value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder="Username" placeholderTextColor="rgba(255,255,255,0.4)"
          value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
        <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="rgba(255,255,255,0.4)"
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <View style={styles.passwordWrap}>
          <TextInput style={[styles.input, styles.passwordInput]} placeholder="Password (min 6 chars)"
            placeholderTextColor="rgba(255,255,255,0.4)" value={password} onChangeText={setPassword}
            secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="rgba(255,255,255,0.4)"
          value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.linkRow}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 24, paddingTop: 60, flexGrow: 1 },
  backBtn: { marginBottom: 24, width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 32 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ef444415', borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#ef444430',
  },
  errorText: { color: '#ef4444', fontSize: 14, flex: 1 },
  input: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, color: '#fff',
    fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a3e',
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  primaryBtn: {
    backgroundColor: '#00d4ff', borderRadius: 14, padding: 18, alignItems: 'center',
    marginTop: 8, shadowColor: '#00d4ff', shadowOpacity: 0.3, shadowRadius: 12,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  secondaryBtnText: { color: '#00d4ff', fontSize: 15, fontWeight: '600' },
  linkRow: { marginTop: 24, alignItems: 'center' },
  linkText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  linkBold: { color: '#00d4ff', fontWeight: '700' },
  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 24, marginBottom: 12 },
  successText: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
