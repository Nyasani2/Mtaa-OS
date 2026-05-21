// app/auth/register.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [step, setStep] = useState<'account' | 'profile' | 'verify'>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCreateAccount = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setStep('profile');
  };

  const handleCompleteRegistration = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Error', 'Full name and phone are required');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signUp(email, password, {
        full_name: fullName,
        phone,
        id_number: idNumber,
      });

      if (error) throw error;

      // Create profile
      if (data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          email: email,
          full_name: fullName,
          phone,
          id_number: idNumber,
          kyc_status: 'pending',
          verification_level: 0,
          trust_score: 50,
          role: 'user',
          is_verified: false,
          metadata: {},
        });
      }

      setStep('verify');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <View style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="mail" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.successTitle}>Verify Your Email</Text>
          <Text style={styles.successText}>
            We've sent a verification link to {email}. Please check your inbox and verify your account.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.loginText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 'profile' ? setStep('account') : router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{step === 'account' ? 'Create Account' : 'Complete Profile'}</Text>
          <View style={{ width: 24 }} />
        </View>

        {step === 'account' ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create password"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#64748B"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.requirements}>
              <Text style={styles.reqTitle}>Password must have:</Text>
              <Text style={[styles.reqItem, password.length >= 8 && styles.reqMet]}>✓ At least 8 characters</Text>
              <Text style={[styles.reqItem, /[A-Z]/.test(password) && styles.reqMet]}>✓ One uppercase letter</Text>
              <Text style={[styles.reqItem, /[0-9]/.test(password) && styles.reqMet]}>✓ One number</Text>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleCreateAccount}>
              <Text style={styles.loginText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +254712345678"
                keyboardType="phone-pad"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID Number (Optional)</Text>
              <TextInput
                style={styles.input}
                value={idNumber}
                onChangeText={setIdNumber}
                placeholder="National ID or Passport"
                placeholderTextColor="#64748B"
              />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleCompleteRegistration} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginText}>Complete Registration</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  form: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#94A3B8', marginBottom: 8 },
  input: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#334155' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155' },
  requirements: { marginBottom: 24 },
  reqTitle: { fontSize: 14, color: '#94A3B8', marginBottom: 8 },
  reqItem: { fontSize: 13, color: '#64748B', marginVertical: 4 },
  reqMet: { color: '#10B981' },
  loginButton: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center' },
  loginText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 16 },
  footerText: { color: '#94A3B8', fontSize: 14 },
  footerLink: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  successText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
});
