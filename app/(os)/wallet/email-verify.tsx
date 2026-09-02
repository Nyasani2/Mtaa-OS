// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EmailVerifyScreen() {
  const router = useRouter();
  const { user, session } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'verified'>('email');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user?.email_confirmed_at) {
      setIsVerified(true);
      setStep('verified');
    }
  }, [user]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email address'); return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setStep('otp');
    setResendTimer(60);
    Alert.alert('OTP Sent', `Check ${email.trim()} for your verification code`);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { Alert.alert('Error', 'Enter the 6-digit OTP'); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: 'email',
    });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setIsVerified(true);
    setStep('verified');
    Alert.alert('Verified!', 'Your email has been successfully verified.');
  };

  const handleUpdateEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email address'); return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setStep('otp');
    setResendTimer(60);
    Alert.alert('OTP Sent', `Check ${email.trim()} for your verification code`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, isVerified ? styles.iconVerified : styles.iconPending]}>
            <Ionicons name={isVerified ? "mail-open" : "mail"} size={40} color="#fff" />
          </View>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            </View>
          )}
        </View>

        <Text style={styles.title}>
          {step === 'email' ? 'Verify Your Email' : step === 'otp' ? 'Enter OTP' : 'Email Verified'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'email' ? 'We will send a 6-digit code to confirm your email address.' :
           step === 'otp' ? `Enter the 6-digit code sent to ${email}` :
           'Your email is verified and secure.'}
        </Text>

        {step === 'email' && (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isVerified}
              />
            </View>
            {!isVerified && (
              <TouchableOpacity style={styles.primaryBtn} onPress={user?.email ? handleUpdateEmail : handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP</Text>}
              </TouchableOpacity>
            )}
          </>
        )}

        {step === 'otp' && (
          <>
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="#3A3A3C"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                textAlign="center"
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendBtn} onPress={handleSendOtp} disabled={resendTimer > 0 || loading}>
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'verified' && (
          <>
            <View style={styles.verifiedCard}>
              <Ionicons name="shield-checkmark" size={32} color="#34C759" />
              <Text style={styles.verifiedTitle}>All Set!</Text>
              <Text style={styles.verifiedDesc}>Your email {email} is verified and linked to your MTAA account.</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(os)/wallet/settings')}>
              <Text style={styles.primaryBtnText}>Go to Settings</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={14} color="#8E8E93" />
          <Text style={styles.securityText}>Your email is used for account recovery and security alerts.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  iconContainer: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  iconPending: { backgroundColor: '#007AFF' },
  iconVerified: { backgroundColor: '#34C759' },
  verifiedBadge: { position: 'absolute', bottom: -4, right: '35%', backgroundColor: '#0A0A0F', borderRadius: 12, padding: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, color: '#fff', fontSize: 16 },
  primaryBtn: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  otpContainer: { marginBottom: 20 },
  otpInput: { backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 18, color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: 8 },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  resendDisabled: { color: '#8E8E93' },
  verifiedCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#34C75930' },
  verifiedTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 12, marginBottom: 4 },
  verifiedDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingBottom: 40, gap: 6 },
  securityText: { fontSize: 12, color: '#8E8E93' },
});
